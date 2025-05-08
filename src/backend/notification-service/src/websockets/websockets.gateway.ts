import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection, 
  OnGatewayDisconnect 
} from '@nestjs/platform-socket.io';
import { UseGuards, Inject, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Span } from '@nestjs/opentelemetry';

// Updated imports using standardized path aliases
import { LoggerService } from '@app/shared/logging';
import { TracingService } from '@app/shared/tracing';

// Import interfaces from the centralized interfaces package
import { 
  Notification,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,
  NotificationType
} from '@austa/interfaces';

import { notification } from '../config/configuration';
import { SendNotificationDto } from '../notifications/dto/send-notification.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { RetryService } from '../retry/retry.service';
import { IRetryableOperation } from '../retry/interfaces/retryable-operation.interface';

/**
 * WebSocket gateway for handling real-time communication in the AUSTA SuperApp.
 * Manages user connections, authentication, and notification delivery with enhanced
 * error handling, retry mechanisms, and standardized interfaces.
 */
@WebSocketGateway({ cors: { origin: '*' } })
export class WebsocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger: Logger;

  /**
   * Initializes the WebSocketGateway with required services.
   * 
   * @param notificationsService - Service for sending notifications
   * @param retryService - Service for handling failed notification delivery
   * @param logger - Service for structured logging
   * @param tracingService - Service for distributed tracing
   */
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly retryService: RetryService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService
  ) {
    this.logger = new Logger('WebsocketsGateway');
  }

  /**
   * Handles new WebSocket connections.
   * Authenticates the user and initializes their connection.
   * 
   * @param client - The connecting Socket.io client
   */
  @Span('websocket.handleConnection')
  handleConnection(client: Socket): void {
    const traceId = this.tracingService.getCurrentTraceId();
    
    this.logger.log(
      `Client connected: ${client.id}`, 
      'WebsocketsGateway',
      { clientId: client.id, traceId }
    );
    
    try {
      // Get authentication token from handshake
      const token = client.handshake.auth.token;
      
      if (!token) {
        this.logger.warn(
          `Client ${client.id} has no authentication token, disconnecting`, 
          'WebsocketsGateway',
          { clientId: client.id, traceId }
        );
        client.disconnect();
        return;
      }
      
      // TODO: Implement JWT verification
      // const userId = verifyAndDecodeToken(token);
      
      // For demonstration purposes
      const userId = this.extractUserIdFromToken(token);
      
      if (!userId) {
        this.logger.warn(
          `Invalid token for client ${client.id}, disconnecting`, 
          'WebsocketsGateway',
          { clientId: client.id, traceId }
        );
        client.disconnect();
        return;
      }
      
      // Store userId in socket data for future reference
      client.data.userId = userId;
      
      // Join user-specific room for targeted notifications
      client.join(`user:${userId}`);
      
      this.logger.log(
        `Client ${client.id} authenticated as user ${userId}`, 
        'WebsocketsGateway',
        { clientId: client.id, userId, traceId }
      );
      
      // Send connection confirmation
      client.emit('connected', { userId, traceId });
    } catch (error) {
      this.logger.error(
        `Error authenticating client ${client.id}`, 
        error, 
        'WebsocketsGateway',
        { clientId: client.id, traceId }
      );
      client.disconnect();
    }
  }

  /**
   * Handles WebSocket disconnections.
   * Cleans up any resources associated with the connection.
   * 
   * @param client - The disconnecting Socket.io client
   */
  @Span('websocket.handleDisconnect')
  handleDisconnect(client: Socket): void {
    const traceId = this.tracingService.getCurrentTraceId();
    
    this.logger.log(
      `Client disconnected: ${client.id}`, 
      'WebsocketsGateway',
      { clientId: client.id, userId: client.data?.userId, traceId }
    );
    
    // Additional cleanup if needed
  }

  /**
   * Handles subscription to journey-specific notifications.
   * 
   * @param client - The Socket.io client
   * @param payload - The subscription payload containing journey ID
   */
  @SubscribeMessage('subscribe')
  @Span('websocket.handleSubscribe')
  handleSubscribe(client: Socket, payload: { journey: string }): void {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      const { journey } = payload;
      const userId = client.data.userId;
      
      if (!userId) {
        this.logger.warn(
          `Unauthenticated client ${client.id} attempted to subscribe to ${journey}`, 
          'WebsocketsGateway',
          { clientId: client.id, journey, traceId }
        );
        return;
      }
      
      // Join journey-specific room
      client.join(`journey:${journey}`);
      
      // Also join combined user+journey room for targeted journey notifications
      client.join(`user:${userId}:journey:${journey}`);
      
      this.logger.log(
        `User ${userId} subscribed to ${journey} notifications`, 
        'WebsocketsGateway',
        { userId, journey, clientId: client.id, traceId }
      );
      
      // Confirm subscription to client
      client.emit('subscribed', { journey, traceId });
    } catch (error) {
      this.logger.error(
        `Error in subscription handling`, 
        error, 
        'WebsocketsGateway',
        { clientId: client.id, payload, traceId }
      );
      client.emit('error', { message: 'Failed to subscribe to notifications', traceId });
    }
  }

  /**
   * Handles unsubscription from journey-specific notifications.
   * 
   * @param client - The Socket.io client
   * @param payload - The unsubscription payload containing journey ID
   */
  @SubscribeMessage('unsubscribe')
  @Span('websocket.handleUnsubscribe')
  handleUnsubscribe(client: Socket, payload: { journey: string }): void {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      const { journey } = payload;
      const userId = client.data.userId;
      
      if (!userId) {
        this.logger.warn(
          `Unauthenticated client ${client.id} attempted to unsubscribe from ${journey}`, 
          'WebsocketsGateway',
          { clientId: client.id, journey, traceId }
        );
        return;
      }
      
      // Leave journey-specific rooms
      client.leave(`journey:${journey}`);
      client.leave(`user:${userId}:journey:${journey}`);
      
      this.logger.log(
        `User ${userId} unsubscribed from ${journey} notifications`, 
        'WebsocketsGateway',
        { userId, journey, clientId: client.id, traceId }
      );
      
      // Confirm unsubscription to client
      client.emit('unsubscribed', { journey, traceId });
    } catch (error) {
      this.logger.error(
        `Error in unsubscription handling`, 
        error, 
        'WebsocketsGateway',
        { clientId: client.id, payload, traceId }
      );
      client.emit('error', { message: 'Failed to unsubscribe from notifications', traceId });
    }
  }

  /**
   * Handles marking notifications as read.
   * 
   * @param client - The Socket.io client
   * @param payload - The notification ID to mark as read
   */
  @SubscribeMessage('markAsRead')
  @Span('websocket.markAsRead')
  async handleMarkAsRead(client: Socket, payload: { notificationId: number }): Promise<void> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      const { notificationId } = payload;
      const userId = client.data.userId;
      
      if (!userId) {
        this.logger.warn(
          `Unauthenticated client ${client.id} attempted to mark notification as read`, 
          'WebsocketsGateway',
          { clientId: client.id, notificationId, traceId }
        );
        return;
      }
      
      await this.notificationsService.markAsRead(notificationId);
      
      this.logger.log(
        `User ${userId} marked notification ${notificationId} as read`, 
        'WebsocketsGateway',
        { userId, notificationId, clientId: client.id, traceId }
      );
      
      // Confirm to client
      client.emit('marked', { notificationId, traceId });
    } catch (error) {
      this.logger.error(
        `Error marking notification as read`, 
        error, 
        'WebsocketsGateway',
        { clientId: client.id, payload, traceId }
      );
      client.emit('error', { message: 'Failed to mark notification as read', traceId });
    }
  }

  /**
   * Sends a notification to a specific user.
   * Used by NotificationsService to dispatch real-time notifications.
   * Includes retry mechanism for failed deliveries.
   * 
   * @param userId - The user ID to send the notification to
   * @param notification - The notification object to send
   */
  @Span('websocket.sendToUser')
  async sendToUser(userId: string, notification: Notification): Promise<void> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.server.to(`user:${userId}`).emit('notification', notification);
      
      this.logger.debug(
        `Sent notification to user ${userId}`, 
        'WebsocketsGateway',
        { userId, notificationId: notification.id, type: notification.type, traceId }
      );
    } catch (error) {
      this.logger.error(
        `Error sending notification to user ${userId}`, 
        error, 
        'WebsocketsGateway',
        { userId, notificationId: notification.id, traceId }
      );
      
      // Create a retryable operation for the failed notification
      const retryableOperation = this.createRetryableOperation(userId, notification);
      
      // Schedule retry with the retry service
      await this.retryService.scheduleRetry(
        retryableOperation,
        error,
        {
          notificationId: notification.id,
          userId,
          channel: NotificationChannel.IN_APP,
          attemptCount: 0
        }
      );
    }
  }

  /**
   * Sends a journey-specific notification to a user.
   * Includes retry mechanism and fallback strategies for failed deliveries.
   * 
   * @param userId - The user ID to send the notification to
   * @param journey - The journey context for the notification
   * @param notification - The notification object to send
   */
  @Span('websocket.sendJourneyNotificationToUser')
  async sendJourneyNotificationToUser(
    userId: string, 
    journey: string, 
    notification: Notification
  ): Promise<void> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.server.to(`user:${userId}:journey:${journey}`).emit('notification', notification);
      
      this.logger.debug(
        `Sent ${journey} notification to user ${userId}`, 
        'WebsocketsGateway',
        { userId, journey, notificationId: notification.id, type: notification.type, traceId }
      );
    } catch (error) {
      this.logger.error(
        `Error sending ${journey} notification to user ${userId}`, 
        error, 
        'WebsocketsGateway',
        { userId, journey, notificationId: notification.id, traceId }
      );
      
      // Try fallback to general user room if journey-specific room fails
      try {
        this.logger.debug(
          `Attempting fallback delivery for ${journey} notification to user ${userId}`, 
          'WebsocketsGateway',
          { userId, journey, notificationId: notification.id, traceId }
        );
        
        // Send to general user room as fallback
        this.server.to(`user:${userId}`).emit('notification', {
          ...notification,
          metadata: {
            ...notification.metadata,
            fallback: true,
            originalJourney: journey
          }
        });
        
        this.logger.debug(
          `Fallback delivery succeeded for ${journey} notification to user ${userId}`, 
          'WebsocketsGateway',
          { userId, journey, notificationId: notification.id, traceId }
        );
      } catch (fallbackError) {
        this.logger.error(
          `Fallback delivery failed for ${journey} notification to user ${userId}`, 
          fallbackError, 
          'WebsocketsGateway',
          { userId, journey, notificationId: notification.id, traceId }
        );
        
        // Create a retryable operation for the failed notification
        const retryableOperation = this.createJourneyRetryableOperation(userId, journey, notification);
        
        // Schedule retry with the retry service
        await this.retryService.scheduleRetry(
          retryableOperation,
          error,
          {
            notificationId: notification.id,
            userId,
            channel: NotificationChannel.IN_APP,
            attemptCount: 0
          }
        );
      }
    }
  }

  /**
   * Broadcasts a notification to all users subscribed to a specific journey.
   * Includes retry mechanism for failed deliveries.
   * 
   * @param journey - The journey context for the notification
   * @param notification - The notification object to broadcast
   */
  @Span('websocket.broadcastToJourney')
  async broadcastToJourney(journey: string, notification: Notification): Promise<void> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      this.server.to(`journey:${journey}`).emit('notification', notification);
      
      this.logger.debug(
        `Broadcast notification to journey ${journey}`, 
        'WebsocketsGateway',
        { journey, notificationId: notification.id, type: notification.type, traceId }
      );
    } catch (error) {
      this.logger.error(
        `Error broadcasting to journey ${journey}`, 
        error, 
        'WebsocketsGateway',
        { journey, notificationId: notification.id, traceId }
      );
      
      // Create a retryable operation for the failed broadcast
      const retryableOperation = this.createBroadcastRetryableOperation(journey, notification);
      
      // Schedule retry with the retry service
      await this.retryService.scheduleRetry(
        retryableOperation,
        error,
        {
          notificationId: notification.id,
          userId: 'broadcast',  // Special case for broadcasts
          channel: NotificationChannel.IN_APP,
          attemptCount: 0
        }
      );
    }
  }

  /**
   * Creates a retryable operation for sending a notification to a user.
   * 
   * @param userId - The user ID to send the notification to
   * @param notification - The notification object to send
   * @returns A retryable operation
   * @private
   */
  private createRetryableOperation(userId: string, notification: Notification): IRetryableOperation {
    return {
      execute: async () => {
        this.server.to(`user:${userId}`).emit('notification', notification);
      },
      getPayload: () => ({
        userId,
        notification
      }),
      getMetadata: () => ({
        notificationId: notification.id,
        type: notification.type,
        userId
      })
    };
  }

  /**
   * Creates a retryable operation for sending a journey-specific notification to a user.
   * 
   * @param userId - The user ID to send the notification to
   * @param journey - The journey context for the notification
   * @param notification - The notification object to send
   * @returns A retryable operation
   * @private
   */
  private createJourneyRetryableOperation(
    userId: string, 
    journey: string, 
    notification: Notification
  ): IRetryableOperation {
    return {
      execute: async () => {
        this.server.to(`user:${userId}:journey:${journey}`).emit('notification', notification);
      },
      getPayload: () => ({
        userId,
        journey,
        notification
      }),
      getMetadata: () => ({
        notificationId: notification.id,
        type: notification.type,
        userId,
        journey
      })
    };
  }

  /**
   * Creates a retryable operation for broadcasting a notification to a journey.
   * 
   * @param journey - The journey context for the notification
   * @param notification - The notification object to broadcast
   * @returns A retryable operation
   * @private
   */
  private createBroadcastRetryableOperation(
    journey: string, 
    notification: Notification
  ): IRetryableOperation {
    return {
      execute: async () => {
        this.server.to(`journey:${journey}`).emit('notification', notification);
      },
      getPayload: () => ({
        journey,
        notification
      }),
      getMetadata: () => ({
        notificationId: notification.id,
        type: notification.type,
        journey,
        broadcast: true
      })
    };
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