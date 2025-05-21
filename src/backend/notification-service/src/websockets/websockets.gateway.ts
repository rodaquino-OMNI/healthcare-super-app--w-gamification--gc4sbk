import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection, 
  OnGatewayDisconnect 
} from '@nestjs/platform-socket.io';
import { UseGuards, Inject, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

// Updated imports using standardized path aliases
import { LoggerService } from '@app/shared/logging';
import { TracingService } from '@app/shared/tracing';

// Import interfaces from the new @austa/interfaces package
import { 
  Notification,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority
} from '@austa/interfaces/notification/types';
import { NotificationPreference } from '@austa/interfaces/notification/preferences';

import { notification } from '../config/configuration';
import { SendNotificationDto } from '../notifications/dto/send-notification.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { RetryService } from '../retry/retry.service';
import { IRetryOptions } from '../retry/interfaces';

/**
 * WebSocket gateway for handling real-time communication in the AUSTA SuperApp.
 * Manages user connections, authentication, and notification delivery with retry support.
 */
@WebSocketGateway({ cors: { origin: '*' } })
export class WebsocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger: Logger;

  /**
   * Initializes the WebSocketGateway with required services.
   * 
   * @param notificationsService - Service for sending notifications
   * @param logger - Service for logging events
   * @param tracingService - Service for distributed tracing
   * @param retryService - Service for handling retry operations for failed notifications
   */
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
    private readonly retryService: RetryService
  ) {
    this.logger = new Logger('WebsocketsGateway');
  }

  /**
   * Handles new WebSocket connections.
   * Authenticates the user and initializes their connection.
   * 
   * @param client - The connecting Socket.io client
   */
  handleConnection(client: Socket): void {
    const span = this.tracingService.startSpan('WebsocketsGateway.handleConnection');
    
    try {
      span.setAttributes({
        'client.id': client.id,
        'connection.type': 'websocket'
      });
      
      this.logger.log(`Client connected: ${client.id}`, 'WebsocketsGateway');
      
      // Get authentication token from handshake
      const token = client.handshake.auth.token;
      
      if (!token) {
        this.logger.warn(`Client ${client.id} has no authentication token, disconnecting`, 'WebsocketsGateway');
        client.disconnect();
        return;
      }
      
      // TODO: Implement JWT verification
      // const userId = verifyAndDecodeToken(token);
      
      // For demonstration purposes
      const userId = this.extractUserIdFromToken(token);
      
      if (!userId) {
        this.logger.warn(`Invalid token for client ${client.id}, disconnecting`, 'WebsocketsGateway');
        client.disconnect();
        return;
      }
      
      // Store userId in socket data for future reference
      client.data.userId = userId;
      
      // Join user-specific room for targeted notifications
      client.join(`user:${userId}`);
      
      this.logger.log(`Client ${client.id} authenticated as user ${userId}`, 'WebsocketsGateway');
      
      // Send connection confirmation
      client.emit('connected', { userId });
    } catch (error) {
      span.setAttributes({
        'error': true,
        'error.message': error.message
      });
      
      this.logger.error(`Error authenticating client ${client.id}`, error.stack, 'WebsocketsGateway');
      client.disconnect();
    } finally {
      span.end();
    }
  }

  /**
   * Handles WebSocket disconnections.
   * Cleans up any resources associated with the connection.
   * 
   * @param client - The disconnecting Socket.io client
   */
  handleDisconnect(client: Socket): void {
    const span = this.tracingService.startSpan('WebsocketsGateway.handleDisconnect');
    
    try {
      span.setAttributes({
        'client.id': client.id,
        'user.id': client.data.userId || 'unknown'
      });
      
      this.logger.log(`Client disconnected: ${client.id}`, 'WebsocketsGateway');
      
      // Additional cleanup if needed
    } catch (error) {
      span.setAttributes({
        'error': true,
        'error.message': error.message
      });
      
      this.logger.error(`Error handling disconnect for client ${client.id}`, error.stack, 'WebsocketsGateway');
    } finally {
      span.end();
    }
  }

  /**
   * Handles subscription to journey-specific notifications.
   * 
   * @param client - The Socket.io client
   * @param payload - The subscription payload containing journey ID
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { journey: string }): void {
    const span = this.tracingService.startSpan('WebsocketsGateway.handleSubscribe');
    
    try {
      const { journey } = payload;
      const userId = client.data.userId;
      
      span.setAttributes({
        'client.id': client.id,
        'user.id': userId || 'unknown',
        'journey': journey
      });
      
      if (!userId) {
        this.logger.warn(`Unauthenticated client ${client.id} attempted to subscribe to ${journey}`, 'WebsocketsGateway');
        client.emit('error', { message: 'Authentication required' });
        return;
      }
      
      // Join journey-specific room
      client.join(`journey:${journey}`);
      
      // Also join combined user+journey room for targeted journey notifications
      client.join(`user:${userId}:journey:${journey}`);
      
      this.logger.log(`User ${userId} subscribed to ${journey} notifications`, 'WebsocketsGateway');
      
      // Confirm subscription to client
      client.emit('subscribed', { journey });
    } catch (error) {
      span.setAttributes({
        'error': true,
        'error.message': error.message
      });
      
      this.logger.error(`Error in subscription handling`, error.stack, 'WebsocketsGateway');
      client.emit('error', { message: 'Failed to subscribe to notifications' });
    } finally {
      span.end();
    }
  }

  /**
   * Handles unsubscription from journey-specific notifications.
   * 
   * @param client - The Socket.io client
   * @param payload - The unsubscription payload containing journey ID
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, payload: { journey: string }): void {
    const span = this.tracingService.startSpan('WebsocketsGateway.handleUnsubscribe');
    
    try {
      const { journey } = payload;
      const userId = client.data.userId;
      
      span.setAttributes({
        'client.id': client.id,
        'user.id': userId || 'unknown',
        'journey': journey
      });
      
      if (!userId) {
        this.logger.warn(`Unauthenticated client ${client.id} attempted to unsubscribe from ${journey}`, 'WebsocketsGateway');
        client.emit('error', { message: 'Authentication required' });
        return;
      }
      
      // Leave journey-specific rooms
      client.leave(`journey:${journey}`);
      client.leave(`user:${userId}:journey:${journey}`);
      
      this.logger.log(`User ${userId} unsubscribed from ${journey} notifications`, 'WebsocketsGateway');
      
      // Confirm unsubscription to client
      client.emit('unsubscribed', { journey });
    } catch (error) {
      span.setAttributes({
        'error': true,
        'error.message': error.message
      });
      
      this.logger.error(`Error in unsubscription handling`, error.stack, 'WebsocketsGateway');
      client.emit('error', { message: 'Failed to unsubscribe from notifications' });
    } finally {
      span.end();
    }
  }

  /**
   * Handles marking notifications as read.
   * 
   * @param client - The Socket.io client
   * @param payload - The notification ID to mark as read
   */
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(client: Socket, payload: { notificationId: number }): Promise<void> {
    const span = this.tracingService.startSpan('WebsocketsGateway.handleMarkAsRead');
    
    try {
      const { notificationId } = payload;
      const userId = client.data.userId;
      
      span.setAttributes({
        'client.id': client.id,
        'user.id': userId || 'unknown',
        'notification.id': notificationId
      });
      
      if (!userId) {
        this.logger.warn(`Unauthenticated client ${client.id} attempted to mark notification as read`, 'WebsocketsGateway');
        client.emit('error', { message: 'Authentication required' });
        return;
      }
      
      await this.tracingService.createSpan('websocket.markAsRead', async (childSpan) => {
        await this.notificationsService.markAsRead(notificationId);
        
        this.logger.log(`User ${userId} marked notification ${notificationId} as read`, 'WebsocketsGateway');
        
        // Confirm to client
        client.emit('marked', { notificationId });
      }, span);
    } catch (error) {
      span.setAttributes({
        'error': true,
        'error.message': error.message
      });
      
      this.logger.error(`Error marking notification as read`, error.stack, 'WebsocketsGateway');
      client.emit('error', { message: 'Failed to mark notification as read' });
    } finally {
      span.end();
    }
  }

  /**
   * Sends a notification to a specific user.
   * Used by NotificationsService to dispatch real-time notifications.
   * Includes retry logic for failed deliveries.
   * 
   * @param userId - The user ID to send the notification to
   * @param notification - The notification object to send
   * @returns Promise resolving to true if sent successfully, false otherwise
   */
  async sendToUser(userId: string, notification: Notification): Promise<boolean> {
    const span = this.tracingService.startSpan('WebsocketsGateway.sendToUser');
    
    try {
      span.setAttributes({
        'user.id': userId,
        'notification.type': notification.type,
        'notification.channel': NotificationChannel.IN_APP
      });
      
      this.server.to(`user:${userId}`).emit('notification', notification);
      this.logger.debug(`Sent notification to user ${userId}`, 'WebsocketsGateway');
      
      return true;
    } catch (error) {
      span.setAttributes({
        'error': true,
        'error.message': error.message
      });
      
      this.logger.error(`Error sending notification to user ${userId}`, error.stack, 'WebsocketsGateway');
      
      // Schedule retry for failed delivery
      try {
        const retryOptions: Partial<IRetryOptions> = {
          maxRetries: 3,
          initialDelay: 1000, // 1 second
        };
        
        // Create a payload for retry
        const retryPayload = {
          userId,
          notification,
          operation: 'sendToUser',
        };
        
        // Schedule retry using the retry service
        // We use a dummy notification ID here since we don't have a real one
        const dummyNotificationId = Date.now();
        await this.retryService.scheduleRetry(
          dummyNotificationId,
          NotificationChannel.IN_APP,
          error,
          retryPayload,
          1, // First attempt
          retryOptions
        );
        
        this.logger.log(`Scheduled retry for notification to user ${userId}`, 'WebsocketsGateway');
      } catch (retryError) {
        this.logger.error(
          `Failed to schedule retry for notification to user ${userId}`,
          retryError.stack,
          'WebsocketsGateway'
        );
      }
      
      return false;
    } finally {
      span.end();
    }
  }

  /**
   * Sends a journey-specific notification to a user.
   * Includes retry logic for failed deliveries.
   * 
   * @param userId - The user ID to send the notification to
   * @param journey - The journey context for the notification
   * @param notification - The notification object to send
   * @returns Promise resolving to true if sent successfully, false otherwise
   */
  async sendJourneyNotificationToUser(
    userId: string, 
    journey: string, 
    notification: Notification
  ): Promise<boolean> {
    const span = this.tracingService.startSpan('WebsocketsGateway.sendJourneyNotificationToUser');
    
    try {
      span.setAttributes({
        'user.id': userId,
        'journey': journey,
        'notification.type': notification.type,
        'notification.channel': NotificationChannel.IN_APP
      });
      
      this.server.to(`user:${userId}:journey:${journey}`).emit('notification', notification);
      this.logger.debug(`Sent ${journey} notification to user ${userId}`, 'WebsocketsGateway');
      
      return true;
    } catch (error) {
      span.setAttributes({
        'error': true,
        'error.message': error.message
      });
      
      this.logger.error(`Error sending ${journey} notification to user ${userId}`, error.stack, 'WebsocketsGateway');
      
      // Schedule retry for failed delivery
      try {
        const retryOptions: Partial<IRetryOptions> = {
          maxRetries: 3,
          initialDelay: 1000, // 1 second
        };
        
        // Create a payload for retry
        const retryPayload = {
          userId,
          journey,
          notification,
          operation: 'sendJourneyNotificationToUser',
        };
        
        // Schedule retry using the retry service
        // We use a dummy notification ID here since we don't have a real one
        const dummyNotificationId = Date.now();
        await this.retryService.scheduleRetry(
          dummyNotificationId,
          NotificationChannel.IN_APP,
          error,
          retryPayload,
          1, // First attempt
          retryOptions
        );
        
        this.logger.log(`Scheduled retry for ${journey} notification to user ${userId}`, 'WebsocketsGateway');
      } catch (retryError) {
        this.logger.error(
          `Failed to schedule retry for ${journey} notification to user ${userId}`,
          retryError.stack,
          'WebsocketsGateway'
        );
      }
      
      return false;
    } finally {
      span.end();
    }
  }

  /**
   * Broadcasts a notification to all users subscribed to a specific journey.
   * Includes retry logic for failed deliveries.
   * 
   * @param journey - The journey context for the notification
   * @param notification - The notification object to broadcast
   * @returns Promise resolving to true if broadcast successfully, false otherwise
   */
  async broadcastToJourney(journey: string, notification: Notification): Promise<boolean> {
    const span = this.tracingService.startSpan('WebsocketsGateway.broadcastToJourney');
    
    try {
      span.setAttributes({
        'journey': journey,
        'notification.type': notification.type,
        'notification.channel': NotificationChannel.IN_APP
      });
      
      this.server.to(`journey:${journey}`).emit('notification', notification);
      this.logger.debug(`Broadcast notification to journey ${journey}`, 'WebsocketsGateway');
      
      return true;
    } catch (error) {
      span.setAttributes({
        'error': true,
        'error.message': error.message
      });
      
      this.logger.error(`Error broadcasting to journey ${journey}`, error.stack, 'WebsocketsGateway');
      
      // Schedule retry for failed delivery
      try {
        const retryOptions: Partial<IRetryOptions> = {
          maxRetries: 2, // Fewer retries for broadcasts as they're less critical
          initialDelay: 2000, // 2 seconds
        };
        
        // Create a payload for retry
        const retryPayload = {
          journey,
          notification,
          operation: 'broadcastToJourney',
        };
        
        // Schedule retry using the retry service
        // We use a dummy notification ID here since we don't have a real one
        const dummyNotificationId = Date.now();
        await this.retryService.scheduleRetry(
          dummyNotificationId,
          NotificationChannel.IN_APP,
          error,
          retryPayload,
          1, // First attempt
          retryOptions
        );
        
        this.logger.log(`Scheduled retry for broadcast to journey ${journey}`, 'WebsocketsGateway');
      } catch (retryError) {
        this.logger.error(
          `Failed to schedule retry for broadcast to journey ${journey}`,
          retryError.stack,
          'WebsocketsGateway'
        );
      }
      
      return false;
    } finally {
      span.end();
    }
  }

  /**
   * Implements fallback delivery for notifications when the primary channel fails.
   * Attempts to deliver through alternative channels based on priority.
   * 
   * @param userId - The user ID to send the notification to
   * @param notification - The notification object to send
   * @param failedChannel - The channel that failed to deliver
   * @returns Promise resolving to true if delivered through fallback, false otherwise
   */
  async deliverWithFallback(
    userId: string, 
    notification: Notification, 
    failedChannel: NotificationChannel
  ): Promise<boolean> {
    const span = this.tracingService.startSpan('WebsocketsGateway.deliverWithFallback');
    
    try {
      span.setAttributes({
        'user.id': userId,
        'notification.type': notification.type,
        'failed.channel': failedChannel
      });
      
      this.logger.log(
        `Attempting fallback delivery for user ${userId} after ${failedChannel} channel failed`,
        'WebsocketsGateway'
      );
      
      // Determine fallback channels based on priority
      // In-app -> Push -> Email -> SMS
      const fallbackChannels: NotificationChannel[] = [];
      
      if (failedChannel !== NotificationChannel.PUSH) {
        fallbackChannels.push(NotificationChannel.PUSH);
      }
      
      if (failedChannel !== NotificationChannel.EMAIL) {
        fallbackChannels.push(NotificationChannel.EMAIL);
      }
      
      if (failedChannel !== NotificationChannel.SMS && notification.priority === NotificationPriority.HIGH) {
        // Only use SMS as fallback for high priority notifications
        fallbackChannels.push(NotificationChannel.SMS);
      }
      
      // Try each fallback channel
      for (const channel of fallbackChannels) {
        try {
          // Create a modified notification with the new channel
          const fallbackNotification: Notification = {
            ...notification,
            channel,
            // Add metadata about the fallback
            metadata: {
              ...notification.metadata,
              originalChannel: failedChannel,
              fallbackDelivery: true
            }
          };
          
          // Use the notifications service to send through the fallback channel
          const sendNotificationDto = new SendNotificationDto();
          sendNotificationDto.userId = userId;
          sendNotificationDto.type = notification.type;
          sendNotificationDto.title = notification.title;
          sendNotificationDto.body = notification.body;
          sendNotificationDto.data = notification.data;
          
          await this.notificationsService.sendNotification(sendNotificationDto);
          
          this.logger.log(
            `Successfully delivered notification to user ${userId} through fallback channel ${channel}`,
            'WebsocketsGateway'
          );
          
          return true;
        } catch (fallbackError) {
          this.logger.warn(
            `Fallback delivery through ${channel} failed for user ${userId}`,
            'WebsocketsGateway'
          );
          // Continue to next fallback channel
        }
      }
      
      this.logger.error(
        `All fallback channels failed for notification to user ${userId}`,
        'WebsocketsGateway'
      );
      return false;
    } catch (error) {
      span.setAttributes({
        'error': true,
        'error.message': error.message
      });
      
      this.logger.error(
        `Error in fallback delivery for user ${userId}`,
        error.stack,
        'WebsocketsGateway'
      );
      return false;
    } finally {
      span.end();
    }
  }

  /**
   * Temporary method to extract user ID from token for demonstration.
   * In production, this would be replaced with proper JWT verification.
   * 
   * @param token - The authentication token
   * @returns The extracted user ID or null if invalid
   * @private
   */
  private extractUserIdFromToken(token: string): string | null {
    // This is a placeholder implementation for demonstration purposes
    // In production, use a proper JWT library to decode and verify tokens
    if (token && token.length > 10) {
      // Simply return the token as user ID for demonstration
      return token;
    }
    return null;
  }
}