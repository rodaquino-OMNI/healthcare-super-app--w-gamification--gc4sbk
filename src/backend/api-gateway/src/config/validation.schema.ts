import * as Joi from 'joi';
import { ErrorType } from '@app/shared/exceptions/exceptions.types';
import { JourneyType } from '@austa/interfaces/common/journey.types';

/**
 * Validation schema for the API Gateway configuration.
 * Ensures all required configuration parameters are provided and have the correct format.
 * Implements enhanced validation rules for journey-specific configuration.
 */
export class ApiGatewayConfigValidation {
  /**
   * Complete validation schema for the API Gateway configuration
   */
  static schema = Joi.object({
    env: Joi.string().valid('development', 'staging', 'production', 'test').required()
      .description('Application environment'),
    server: Joi.object({
      port: Joi.number().port().required()
        .description('Port number the API Gateway will listen on'),
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
      timeout: Joi.number().min(1000).default(30000)
        .description('Request timeout in milliseconds')
    }).required()
      .description('Server configuration'),
    
    authentication: Joi.object({
      jwtSecret: Joi.string().min(32).required()
        .description('Secret key for JWT token signing'),
      tokenExpiration: Joi.string().pattern(/^\d+[smhd]$/).required()
        .description('JWT access token expiration period (e.g., "1h", "30m")'),
      refreshTokenExpiration: Joi.string().pattern(/^\d+[smhd]$/).required()
        .description('JWT refresh token expiration period (e.g., "7d", "30d")'),
      tokenBlacklisting: Joi.object({
        enabled: Joi.boolean().default(true)
          .description('Whether to enable token blacklisting for revocation'),
        redisPrefix: Joi.string().default('blacklist:')
          .description('Redis key prefix for blacklisted tokens')
      }).default()
        .description('Token blacklisting configuration')
    }).required()
      .description('Authentication configuration'),
    
    rateLimiting: Joi.object({
      windowMs: Joi.number().min(1000).required()
        .description('Time window for rate limiting in milliseconds'),
      max: Joi.number().min(1).required()
        .description('Maximum number of requests within the time window'),
      journeyLimits: Joi.object().pattern(
        Joi.string().valid(JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN),
        Joi.number().min(1)
      ).required()
        .description('Rate limits specific to each journey'),
      standardHeaders: Joi.boolean().default(true)
        .description('Whether to add standard rate limit headers to responses'),
      legacyHeaders: Joi.boolean().default(false)
        .description('Whether to add legacy rate limit headers to responses'),
      skipSuccessfulRequests: Joi.boolean().default(false)
        .description('Whether to skip rate limiting for successful requests'),
      keyGenerator: Joi.object({
        type: Joi.string().valid('ip', 'user', 'custom').default('ip')
          .description('Type of key generator for rate limiting'),
        headerName: Joi.string().when('type', {
          is: 'custom',
          then: Joi.required(),
          otherwise: Joi.optional()
        }).description('Header name to use for custom key generation')
      }).default({ type: 'ip' })
        .description('Key generator configuration for rate limiting')
    }).required()
      .description('Rate limiting configuration'),
    
    caching: Joi.object({
      ttl: Joi.object().pattern(
        Joi.string().valid(JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN),
        Joi.string().pattern(/^\d+[smh]$/)
      ).required()
        .description('Time-to-live for cached responses by journey'),
      maxItems: Joi.number().min(100).default(1000)
        .description('Maximum number of items in the cache'),
      checkPeriod: Joi.number().min(0).default(600)
        .description('How often to check for expired items (in seconds)'),
      excludePaths: Joi.array().items(Joi.string()).default([])
        .description('Paths to exclude from caching'),
      redisConfig: Joi.object({
        enabled: Joi.boolean().default(false)
          .description('Whether to use Redis for caching'),
        host: Joi.string().when('enabled', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.optional()
        }).description('Redis host'),
        port: Joi.number().port().when('enabled', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.optional()
        }).description('Redis port'),
        keyPrefix: Joi.string().default('apigateway:cache:')
          .description('Redis key prefix for cached items')
      }).default({ enabled: false })
        .description('Redis cache configuration')
    }).required()
      .description('Caching configuration'),
    
    services: Joi.object({
      health: Joi.string().uri().required()
        .description('Health journey service URL'),
      care: Joi.string().uri().required()
        .description('Care journey service URL'),
      plan: Joi.string().uri().required()
        .description('Plan journey service URL'),
      game: Joi.string().uri().required()
        .description('Gamification service URL'),
      auth: Joi.string().uri().required()
        .description('Authentication service URL'),
      notification: Joi.string().uri().required()
        .description('Notification service URL')
    }).required()
      .description('Microservices endpoints'),
    
    graphql: Joi.object({
      playground: Joi.boolean().default(false)
        .description('Whether to enable GraphQL playground'),
      debug: Joi.boolean().default(false)
        .description('Whether to enable GraphQL debug mode'),
      introspection: Joi.boolean().default(true)
        .description('Whether to enable GraphQL introspection'),
      csrfPrevention: Joi.boolean().default(true)
        .description('Whether to enable CSRF prevention for GraphQL')
    }).default()
      .description('GraphQL configuration'),
    
    logging: Joi.object({
      level: Joi.string().valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly').default('info')
        .description('Logging level'),
      format: Joi.string().valid('json', 'pretty').default('json')
        .description('Logging format'),
      requestLogging: Joi.boolean().default(true)
        .description('Whether to log HTTP requests')
    }).default({ level: 'info', format: 'json', requestLogging: true })
      .description('Logging configuration'),
    
    monitoring: Joi.object({
      metrics: Joi.object({
        enabled: Joi.boolean().default(true)
          .description('Whether to enable Prometheus metrics'),
        path: Joi.string().default('/metrics')
          .description('Path for Prometheus metrics endpoint')
      }).default({ enabled: true, path: '/metrics' })
        .description('Metrics configuration'),
      healthCheck: Joi.object({
        path: Joi.string().default('/health')
          .description('Path for health check endpoint'),
        detailed: Joi.boolean().default(false)
          .description('Whether to include detailed health information')
      }).default({ path: '/health', detailed: false })
        .description('Health check configuration')
    }).default()
      .description('Monitoring configuration'),
    
    errorHandling: Joi.object({
      showStacktrace: Joi.boolean().default(false)
        .description('Whether to include stack traces in error responses'),
      errorCodes: Joi.object().pattern(
        Joi.string(),
        Joi.object({
          statusCode: Joi.number().required(),
          message: Joi.string().required()
        })
      ).default({})
        .description('Custom error code mappings'),
      fallbackLanguage: Joi.string().default('en')
        .description('Fallback language for error messages')
    }).default({ showStacktrace: false, errorCodes: {}, fallbackLanguage: 'en' })
      .description('Error handling configuration')
  }).required()
    .description('API Gateway configuration');

  /**
   * Validation options with improved error reporting
   */
  static validationOptions = {
    abortEarly: false,
    errors: {
      label: 'key',
      wrap: {
        label: false
      }
    },
    messages: {
      'any.required': '{{#label}} is required',
      'string.base': '{{#label}} must be a string',
      'string.min': '{{#label}} must be at least {{#limit}} characters long',
      'string.pattern.base': '{{#label}} must match the pattern: {{#pattern}}',
      'number.base': '{{#label}} must be a number',
      'number.min': '{{#label}} must be at least {{#limit}}',
      'number.port': '{{#label}} must be a valid port number (0-65535)',
      'array.base': '{{#label}} must be an array',
      'object.base': '{{#label}} must be an object',
      'boolean.base': '{{#label}} must be a boolean',
      'alternatives.match': '{{#label}} does not match any of the allowed types',
      'object.unknown': '{{#label}} is not allowed'
    }
  };

  /**
   * Maps validation errors to structured error objects
   * @param errors - Joi validation errors
   * @returns Array of structured error objects
   */
  static mapValidationErrors(errors: Joi.ValidationErrorItem[]): Array<{
    path: string[];
    type: ErrorType;
    message: string;
  }> {
    return errors.map(error => ({
      path: error.path,
      type: ErrorType.VALIDATION_ERROR,
      message: error.message
    }));
  }

  /**
   * Constructor for the validation schema.
   */
  constructor() {}
}