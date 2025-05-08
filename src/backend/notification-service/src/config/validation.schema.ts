import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Core application settings
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  PORT: Joi.number().default(3000),
  WEBSOCKET_PORT: Joi.number().default(3001),
  
  // Email channel settings
  EMAIL_HOST: Joi.string().default('smtp.example.com'),
  EMAIL_PORT: Joi.number().default(587),
  EMAIL_SECURE: Joi.boolean().default(false),
  EMAIL_USER: Joi.string().allow(''),
  EMAIL_PASSWORD: Joi.string().allow(''),
  EMAIL_DEFAULT_FROM: Joi.string().default('noreply@austa.health'),
  EMAIL_PROVIDER: Joi.string(),
  EMAIL_API_KEY: Joi.string().allow(''),
  EMAIL_TTL: Joi.number().default(604800), // 7 days
  EMAIL_RATE_LIMIT: Joi.number().default(100),
  EMAIL_RATE_WINDOW: Joi.number().default(3600),
  EMAIL_RATE_LIMIT_ENABLED: Joi.boolean().default(true),
  EMAIL_FALLBACK_ENABLED: Joi.boolean().default(true),
  EMAIL_FALLBACK_MAX_ATTEMPTS: Joi.number().default(3),
  EMAIL_FALLBACK_RETRY_DELAY: Joi.number().default(60000),
  
  // SMS channel settings
  SMS_ACCOUNT_SID: Joi.string().allow(''),
  SMS_AUTH_TOKEN: Joi.string().allow(''),
  SMS_DEFAULT_FROM: Joi.string().allow(''),
  SMS_TTL: Joi.number().default(86400), // 24 hours
  SMS_RATE_LIMIT: Joi.number().default(50),
  SMS_RATE_WINDOW: Joi.number().default(3600),
  SMS_RATE_LIMIT_ENABLED: Joi.boolean().default(true),
  SMS_FALLBACK_ENABLED: Joi.boolean().default(true),
  SMS_FALLBACK_MAX_ATTEMPTS: Joi.number().default(3),
  SMS_FALLBACK_RETRY_DELAY: Joi.number().default(60000),
  
  // Push notification channel settings
  PUSH_API_KEY: Joi.string().allow(''),
  PUSH_USE_ADMIN_SDK: Joi.boolean().default(true),
  PUSH_ANDROID_PRIORITY: Joi.string().valid('high', 'normal').default('high'),
  PUSH_ANDROID_TTL: Joi.number().default(2419200), // 28 days
  PUSH_IOS_PRIORITY: Joi.number().default(10),
  PUSH_IOS_CRITICAL: Joi.boolean().default(false),
  PUSH_TTL: Joi.number().default(259200), // 3 days
  PUSH_RATE_LIMIT: Joi.number().default(500),
  PUSH_RATE_WINDOW: Joi.number().default(3600),
  PUSH_RATE_LIMIT_ENABLED: Joi.boolean().default(true),
  PUSH_FALLBACK_ENABLED: Joi.boolean().default(true),
  PUSH_FALLBACK_MAX_ATTEMPTS: Joi.number().default(3),
  PUSH_FALLBACK_RETRY_DELAY: Joi.number().default(30000),
  
  // In-app notification channel settings
  IN_APP_KEY_PREFIX: Joi.string().default('notification:inapp:'),
  IN_APP_TTL: Joi.number().default(2592000), // 30 days
  IN_APP_WEBSOCKET_ENABLED: Joi.boolean().default(true),
  IN_APP_WEBSOCKET_NAMESPACE: Joi.string().default('/notifications'),
  IN_APP_RATE_LIMIT: Joi.number().default(1000),
  IN_APP_RATE_WINDOW: Joi.number().default(3600),
  IN_APP_RATE_LIMIT_ENABLED: Joi.boolean().default(true),
  IN_APP_FALLBACK_ENABLED: Joi.boolean().default(true),
  IN_APP_FALLBACK_MAX_ATTEMPTS: Joi.number().default(3),
  IN_APP_FALLBACK_RETRY_DELAY: Joi.number().default(15000),
  IN_APP_HEALTH_TTL: Joi.number().default(2592000), // 30 days
  IN_APP_CARE_TTL: Joi.number().default(1209600), // 14 days
  IN_APP_PLAN_TTL: Joi.number().default(7776000), // 90 days
  IN_APP_GAME_TTL: Joi.number().default(5184000), // 60 days
  IN_APP_DEFAULT_TTL: Joi.number().default(2592000), // 30 days
  
  // Global notification settings
  NOTIFICATION_ENABLE_FALLBACK: Joi.boolean().default(true),
  NOTIFICATION_TRACK_DELIVERY: Joi.boolean().default(true),
  NOTIFICATION_RETRY_FAILED: Joi.boolean().default(true),
  NOTIFICATION_MAX_RETRY_ATTEMPTS: Joi.number().default(3),
});