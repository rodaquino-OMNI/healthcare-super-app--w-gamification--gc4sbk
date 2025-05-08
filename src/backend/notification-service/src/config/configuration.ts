import { registerAs } from '@nestjs/config';
import channelsConfig from './channels.config';
import { kafkaConfig } from './kafka.config';

/**
 * Notification service configuration factory
 * Registers the notification configuration with the ConfigService
 */
export const notification = registerAs('notification', () => ({
  // Core application settings
  port: parseInt(process.env.PORT || '3000', 10),
  websocketPort: parseInt(process.env.WEBSOCKET_PORT || '3001', 10),
  environment: process.env.NODE_ENV || 'development',
  
  // Email settings
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_DEFAULT_FROM || 'noreply@austa.health',
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    apiKey: process.env.EMAIL_API_KEY || '',
  },
  
  // SMS settings
  sms: {
    accountSid: process.env.SMS_ACCOUNT_SID || '',
    authToken: process.env.SMS_AUTH_TOKEN || '',
    defaultFrom: process.env.SMS_DEFAULT_FROM || '',
  },
  
  // Push notification settings
  push: {
    apiKey: process.env.PUSH_API_KEY || '',
    useAdminSdk: process.env.PUSH_USE_ADMIN_SDK !== 'false',
  },
  
  // In-app notification settings
  inApp: {
    keyPrefix: process.env.IN_APP_KEY_PREFIX || 'notification:inapp:',
    ttl: parseInt(process.env.IN_APP_TTL || '2592000', 10), // 30 days
    websocketEnabled: process.env.IN_APP_WEBSOCKET_ENABLED !== 'false',
    websocketNamespace: process.env.IN_APP_WEBSOCKET_NAMESPACE || '/notifications',
  },
  
  // Journey-specific TTL settings
  journeyTtl: {
    health: parseInt(process.env.IN_APP_HEALTH_TTL || '2592000', 10), // 30 days
    care: parseInt(process.env.IN_APP_CARE_TTL || '1209600', 10), // 14 days
    plan: parseInt(process.env.IN_APP_PLAN_TTL || '7776000', 10), // 90 days
    game: parseInt(process.env.IN_APP_GAME_TTL || '5184000', 10), // 60 days
    default: parseInt(process.env.IN_APP_DEFAULT_TTL || '2592000', 10), // 30 days
  },
}));

/**
 * Main configuration factory for the notification service
 * Combines all configuration modules
 */
export default () => ({
  // Include all configuration modules
  notification: notification(),
  channels: channelsConfig(),
  kafka: kafkaConfig(),
});