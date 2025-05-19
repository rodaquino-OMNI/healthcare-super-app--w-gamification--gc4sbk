import * as Joi from 'joi';
import { JOURNEY_IDS } from '@app/shared/constants/journey.constants';

/**
 * Validation schema for the API Gateway configuration.
 * Ensures all required configuration parameters are provided and have the correct format.
 */
export class ApiGatewayConfigValidation {
  /**
   * Complete validation schema for the API Gateway configuration
   */
  static schema = Joi.object({
    server: Joi.object({
      port: Joi.number().port().required()
        .description('Port number the API Gateway will listen on'),
      host: Joi.string().required()
        .description('Host address the API Gateway will bind to'),
      env: Joi.string().valid('development', 'staging', 'production', 'test').required()
        .description('Application environment'),
      baseUrl: Joi.string().uri().required()
        .description('Base URL for the API Gateway'),
    }).required()
      .description('Server configuration'),
    
    auth: Joi.object({
      jwtSecret: Joi.string().min(32).required()
        .description('Secret key for JWT token signing'),
      tokenExpiration: Joi.string().pattern(/^\d+[smhd]$/).required()
        .description('JWT access token expiration period (e.g., "1h", "30m")'),
      refreshTokenExpiration: Joi.string().pattern(/^\d+[smhd]$/).required()
        .description('JWT refresh token expiration period (e.g., "7d", "30d")'),
      issuer: Joi.string().required()
        .description('JWT issuer claim'),
      audience: Joi.string().required()
        .description('JWT audience claim'),
      errorCodes: Joi.object({
        invalidCredentials: Joi.string().required(),
        tokenExpired: Joi.string(),
        insufficientPermissions: Joi.string(),
      }).required()
        .description('Error codes for authentication failures'),
    }).required()
      .description('Authentication configuration'),
    
    cors: Joi.object({
      origin: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string(), Joi.object().instance(RegExp))
      ).required()
        .description('Allowed origins for CORS'),
      credentials: Joi.boolean().default(true)
        .description('Whether to allow credentials in CORS requests'),
      methods: Joi.array().items(Joi.string()).default(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'])
        .description('Allowed HTTP methods'),
      allowedHeaders: Joi.array().items(Joi.string())
        .description('Allowed HTTP headers'),
      exposedHeaders: Joi.array().items(Joi.string())
        .description('HTTP headers exposed to the browser')
    }).required()
      .description('CORS configuration'),
    
    rateLimit: Joi.object({
      windowMs: Joi.number().min(1000).required()
        .description('Time window for rate limiting in milliseconds'),
      max: Joi.number().min(1).required()
        .description('Maximum number of requests within the time window'),
      journeyLimits: Joi.object().pattern(
        Joi.string().valid(JOURNEY_IDS.HEALTH, JOURNEY_IDS.CARE, JOURNEY_IDS.PLAN),
        Joi.number().min(1)
      ).required()
        .description('Rate limits specific to each journey'),
      message: Joi.string().required()
        .description('Message to return when rate limit is exceeded'),
      standardHeaders: Joi.boolean().default(true)
        .description('Whether to add standard rate limit headers to responses'),
      legacyHeaders: Joi.boolean().default(false)
        .description('Whether to add legacy rate limit headers to responses')
    }).required()
      .description('Rate limiting configuration'),
    
    graphql: Joi.object({
      playground: Joi.boolean().required()
        .description('Whether to enable GraphQL Playground'),
      debug: Joi.boolean().required()
        .description('Whether to enable GraphQL debug mode'),
      autoSchemaFile: Joi.alternatives().try(
        Joi.string(),
        Joi.boolean()
      ).required()
        .description('Path to auto-generated schema file or boolean'),
      sortSchema: Joi.boolean().required()
        .description('Whether to sort the schema'),
      context: Joi.function().required()
        .description('Function to build the GraphQL context'),
      cors: Joi.boolean().required()
        .description('Whether to enable CORS for GraphQL'),
      installSubscriptionHandlers: Joi.boolean().required()
        .description('Whether to install subscription handlers'),
      subscriptions: Joi.object({
        'graphql-ws': Joi.boolean().required(),
        'subscriptions-transport-ws': Joi.boolean().required(),
      }).required()
        .description('GraphQL subscription configuration'),
    }).required()
      .description('GraphQL configuration'),
    
    cache: Joi.object({
      ttl: Joi.object().pattern(
        Joi.string().valid(JOURNEY_IDS.HEALTH, JOURNEY_IDS.CARE, JOURNEY_IDS.PLAN),
        Joi.string().pattern(/^\d+[smh]$/)
      ).required()
        .description('Time-to-live for cached responses by journey'),
      defaultTtl: Joi.string().pattern(/^\d+[smh]$/).required()
        .description('Default time-to-live for cached responses'),
      maxItems: Joi.number().min(100)
        .description('Maximum number of items in the cache'),
      checkPeriod: Joi.number().min(0)
        .description('How often to check for expired items (in seconds)')
    }).required()
      .description('Caching configuration'),
    
    logging: Joi.object({
      level: Joi.string().valid('debug', 'info', 'warn', 'error').required()
        .description('Log level'),
      requestLogging: Joi.boolean().required()
        .description('Whether to log requests'),
      responseLogging: Joi.boolean().required()
        .description('Whether to log responses'),
      prettyPrint: Joi.boolean().required()
        .description('Whether to pretty-print logs'),
      journeyContext: Joi.boolean().required()
        .description('Whether to include journey context in logs'),
    }).required()
      .description('Logging configuration'),
    
    tracing: Joi.object({
      enabled: Joi.boolean().required()
        .description('Whether to enable tracing'),
      serviceName: Joi.string().required()
        .description('Service name for tracing'),
      exporterEndpoint: Joi.string().uri().required()
        .description('Endpoint for the tracing exporter'),
      sampleRate: Joi.number().min(0).max(1)
        .description('Sampling rate for traces'),
    }).required()
      .description('Tracing configuration'),
    
    services: Joi.object({
      auth: Joi.object({
        url: Joi.string().uri().required()
          .description('Auth service URL'),
        timeout: Joi.number().min(100).required()
          .description('Auth service timeout in milliseconds'),
        healthCheckPath: Joi.string()
          .description('Path for health checks'),
      }).required(),
      health: Joi.object({
        url: Joi.string().uri().required()
          .description('Health service URL'),
        timeout: Joi.number().min(100).required()
          .description('Health service timeout in milliseconds'),
        healthCheckPath: Joi.string()
          .description('Path for health checks'),
      }).required(),
      care: Joi.object({
        url: Joi.string().uri().required()
          .description('Care service URL'),
        timeout: Joi.number().min(100).required()
          .description('Care service timeout in milliseconds'),
        healthCheckPath: Joi.string()
          .description('Path for health checks'),
      }).required(),
      plan: Joi.object({
        url: Joi.string().uri().required()
          .description('Plan service URL'),
        timeout: Joi.number().min(100).required()
          .description('Plan service timeout in milliseconds'),
        healthCheckPath: Joi.string()
          .description('Path for health checks'),
      }).required(),
      gamification: Joi.object({
        url: Joi.string().uri().required()
          .description('Gamification service URL'),
        timeout: Joi.number().min(100).required()
          .description('Gamification service timeout in milliseconds'),
        healthCheckPath: Joi.string()
          .description('Path for health checks'),
      }).required(),
      notification: Joi.object({
        url: Joi.string().uri().required()
          .description('Notification service URL'),
        timeout: Joi.number().min(100).required()
          .description('Notification service timeout in milliseconds'),
        healthCheckPath: Joi.string()
          .description('Path for health checks'),
      }).required(),
      discovery: Joi.object({
        enabled: Joi.boolean().required()
          .description('Whether to enable service discovery'),
        provider: Joi.string().valid('static', 'dns', 'kubernetes', 'consul').required()
          .description('Service discovery provider'),
        refreshInterval: Joi.number().min(1000)
          .description('Service discovery refresh interval in milliseconds'),
        namespace: Joi.string()
          .description('Kubernetes namespace for service discovery'),
      })
        .description('Service discovery configuration'),
    }).required()
      .description('Microservices endpoints'),
  }).required()
    .description('API Gateway configuration');

  /**
   * Validation options
   */
  static validationOptions = {
    abortEarly: false,
    errors: {
      label: 'key',
      wrap: {
        label: false
      }
    }
  };

  /**
   * Constructor for the validation schema.
   */
  constructor() {}

  /**
   * Validates the configuration object against the schema
   * @param config Configuration object to validate
   * @returns Validated configuration object
   * @throws Error if validation fails
   */
  static validate(config: Record<string, any>): Record<string, any> {
    const { error, value } = this.schema.validate(config, this.validationOptions);
    
    if (error) {
      const errorMessage = error.details
        .map(detail => `${detail.path.join('.')}: ${detail.message}`)
        .join('\n');
      
      throw new Error(`Configuration validation failed:\n${errorMessage}`);
    }
    
    return value;
  }
}