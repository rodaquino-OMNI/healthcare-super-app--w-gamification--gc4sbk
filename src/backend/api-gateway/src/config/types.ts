/**
 * Type definitions for API Gateway configuration
 * These types ensure type safety and consistency across the service
 */

import { JourneyId } from '@austa/interfaces/common';

/**
 * Server configuration options
 */
export interface ServerConfig {
  port: number;
  host: string;
  env: 'development' | 'staging' | 'production' | 'test';
  baseUrl: string;
}

/**
 * Authentication configuration options
 */
export interface AuthConfig {
  jwtSecret: string;
  tokenExpiration: string;
  refreshTokenExpiration: string;
  issuer: string;
  audience: string;
  errorCodes: {
    invalidCredentials: string;
    tokenExpired?: string;
    insufficientPermissions?: string;
  };
}

/**
 * CORS configuration options
 */
export interface CorsConfig {
  origin: string[] | RegExp[] | (string | RegExp)[];
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders?: string[];
}

/**
 * Rate limiting configuration options with journey-specific limits
 */
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  journeyLimits: Record<JourneyId, number>;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

/**
 * GraphQL configuration options
 */
export interface GraphQLConfig {
  playground: boolean;
  debug: boolean;
  autoSchemaFile: string | boolean;
  sortSchema: boolean;
  context: (context: any) => any;
  cors: boolean;
  installSubscriptionHandlers: boolean;
  subscriptions: {
    'graphql-ws': boolean;
    'subscriptions-transport-ws': boolean;
  };
}

/**
 * Cache configuration options with journey-specific TTLs
 */
export interface CacheConfig {
  ttl: Record<JourneyId, string>;
  defaultTtl: string;
  maxItems?: number;
  checkPeriod?: number;
}

/**
 * Logging configuration options
 */
export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  requestLogging: boolean;
  responseLogging: boolean;
  prettyPrint: boolean;
  journeyContext: boolean;
}

/**
 * Tracing configuration options
 */
export interface TracingConfig {
  enabled: boolean;
  serviceName: string;
  exporterEndpoint: string;
  sampleRate?: number;
}

/**
 * Service endpoint configuration
 */
export interface ServiceEndpointConfig {
  url: string;
  timeout: number;
  healthCheckPath?: string;
}

/**
 * Service discovery configuration
 */
export interface ServiceDiscoveryConfig {
  enabled: boolean;
  provider: 'static' | 'dns' | 'kubernetes' | 'consul';
  refreshInterval?: number;
  namespace?: string;
}

/**
 * Backend services configuration
 */
export interface ServicesConfig {
  auth: ServiceEndpointConfig;
  health: ServiceEndpointConfig;
  care: ServiceEndpointConfig;
  plan: ServiceEndpointConfig;
  gamification: ServiceEndpointConfig;
  notification: ServiceEndpointConfig;
  discovery?: ServiceDiscoveryConfig;
}

/**
 * Complete API Gateway configuration
 */
export interface ApiGatewayConfiguration {
  server: ServerConfig;
  auth: AuthConfig;
  cors: CorsConfig;
  rateLimit: RateLimitConfig;
  graphql: GraphQLConfig;
  cache: CacheConfig;
  logging: LoggingConfig;
  tracing: TracingConfig;
  services: ServicesConfig;
}