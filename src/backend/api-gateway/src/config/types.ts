/**
 * API Gateway Configuration Types
 * 
 * This module defines TypeScript interfaces for all API Gateway configuration objects,
 * ensuring type safety and consistency across the service. It includes journey-specific
 * type definitions for health, care, and plan services, rate limiting configurations,
 * authentication settings, and service communication options.
 * 
 * The type system enables proper static analysis, autocompletion, and runtime
 * verification of configuration properties, reducing the risk of configuration errors.
 * 
 * @module config/types
 * @version 1.0.0
 */

import { JourneyId } from '@austa/interfaces/common';

/**
 * Environment variable converter function type
 */
export type EnvVarConverter<T> = (value: string) => T;

/**
 * Environment variable schema validation rule
 */
export interface EnvVarValidationRule {
  /** Expected type of the environment variable */
  type: 'string' | 'number' | 'boolean' | 'url' | 'enum';
  /** Whether the environment variable is required */
  required?: boolean;
  /** Regular expression pattern for validation */
  pattern?: RegExp;
  /** Minimum value for number types */
  min?: number;
  /** Maximum value for number types */
  max?: number;
  /** Allowed values for enum types */
  enum?: string[];
  /** Description of the environment variable */
  description?: string;
}

/**
 * Environment variable schema
 */
export type EnvVarSchema = Record<string, EnvVarValidationRule>;

/**
 * Complete API Gateway configuration object
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

/**
 * Server configuration
 */
export interface ServerConfig {
  /** Port number the API Gateway will listen on */
  port: number;
  /** Host address the API Gateway will bind to */
  host: string;
  /** Application environment (development, staging, production, test) */
  env: 'development' | 'staging' | 'production' | 'test';
  /** Base URL for the API Gateway */
  baseUrl: string;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /** Secret key for JWT token signing */
  jwtSecret: string;
  /** JWT access token expiration period (e.g., "1h", "30m") */
  tokenExpiration: string;
  /** JWT refresh token expiration period (e.g., "7d", "30d") */
  refreshTokenExpiration: string;
  /** JWT issuer claim */
  issuer: string;
  /** JWT audience claim */
  audience: string;
  /** Error codes for authentication failures */
  errorCodes: {
    /** Error code for invalid credentials */
    invalidCredentials: string;
    /** Error code for expired tokens */
    tokenExpired: string;
    /** Error code for insufficient permissions */
    insufficientPermissions: string;
  };
}

/**
 * CORS configuration
 */
export interface CorsConfig {
  /** Allowed origins for CORS (string, array of strings, or RegExp) */
  origin: string | string[] | RegExp | (string | RegExp)[];
  /** Whether to allow credentials in CORS requests */
  credentials: boolean;
  /** Allowed HTTP methods */
  methods: string[];
  /** Allowed HTTP headers */
  allowedHeaders: string[];
  /** HTTP headers exposed to the browser (optional) */
  exposedHeaders?: string[];
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  /** Time window for rate limiting in milliseconds */
  windowMs: number;
  /** Maximum number of requests within the time window */
  max: number;
  /** Rate limits specific to each journey */
  journeyLimits: Record<JourneyId, number>;
  /** Message to return when rate limit is exceeded */
  message: string;
  /** Whether to add standard rate limit headers to responses */
  standardHeaders: boolean;
  /** Whether to add legacy rate limit headers to responses */
  legacyHeaders: boolean;
}

/**
 * GraphQL configuration
 */
export interface GraphQLConfig {
  /** Whether to enable GraphQL Playground */
  playground: boolean;
  /** Whether to enable GraphQL debug mode */
  debug: boolean;
  /** Path to auto-generated schema file or boolean */
  autoSchemaFile: string | boolean;
  /** Whether to sort the schema */
  sortSchema: boolean;
  /** Function to build the GraphQL context */
  context: (context: { req: any; res: any }) => { req: any; res: any };
  /** Whether to enable CORS for GraphQL */
  cors: boolean;
  /** Whether to install subscription handlers */
  installSubscriptionHandlers: boolean;
  /** GraphQL subscription configuration */
  subscriptions: {
    /** Whether to enable graphql-ws subscriptions */
    'graphql-ws': boolean;
    /** Whether to enable subscriptions-transport-ws subscriptions */
    'subscriptions-transport-ws': boolean;
  };
}

/**
 * Caching configuration
 */
export interface CacheConfig {
  /** Time-to-live for cached responses by journey */
  ttl: Record<JourneyId, string>;
  /** Default time-to-live for cached responses */
  defaultTtl: string;
  /** Maximum number of items in the cache */
  maxItems?: number;
  /** How often to check for expired items (in seconds) */
  checkPeriod?: number;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Whether to log requests */
  requestLogging: boolean;
  /** Whether to log responses */
  responseLogging: boolean;
  /** Whether to pretty-print logs */
  prettyPrint: boolean;
  /** Whether to include journey context in logs */
  journeyContext: boolean;
}

/**
 * Tracing configuration
 */
export interface TracingConfig {
  /** Whether to enable tracing */
  enabled: boolean;
  /** Service name for tracing */
  serviceName: string;
  /** Endpoint for the tracing exporter */
  exporterEndpoint: string;
  /** Sampling rate for traces (0-1) */
  sampleRate?: number;
}

/**
 * Services configuration
 */
export interface ServicesConfig {
  /** Auth service configuration */
  auth: ServiceConfig;
  /** Health service configuration */
  health: HealthServiceConfig;
  /** Care service configuration */
  care: CareServiceConfig;
  /** Plan service configuration */
  plan: PlanServiceConfig;
  /** Gamification service configuration */
  gamification: ServiceConfig;
  /** Notification service configuration */
  notification: ServiceConfig;
  /** Service discovery configuration */
  discovery: ServiceDiscoveryConfig;
}

/**
 * Individual service configuration
 */
export interface ServiceConfig {
  /** Service URL */
  url: string;
  /** Service timeout in milliseconds */
  timeout: number;
  /** Path for health checks */
  healthCheckPath?: string;
}

/**
 * Service discovery configuration
 */
export interface ServiceDiscoveryConfig {
  /** Whether to enable service discovery */
  enabled: boolean;
  /** Service discovery provider */
  provider: 'static' | 'dns' | 'kubernetes' | 'consul';
  /** Service discovery refresh interval in milliseconds */
  refreshInterval?: number;
  /** Kubernetes namespace for service discovery */
  namespace?: string;
}

/**
 * Journey-specific health service configuration
 */
export interface HealthServiceConfig extends ServiceConfig {
  /** Health metrics endpoint */
  metricsEndpoint?: string;
  /** Health goals endpoint */
  goalsEndpoint?: string;
  /** Medical devices endpoint */
  devicesEndpoint?: string;
  /** Medical history endpoint */
  medicalHistoryEndpoint?: string;
  /** FHIR integration endpoint */
  fhirEndpoint?: string;
}

/**
 * Journey-specific care service configuration
 */
export interface CareServiceConfig extends ServiceConfig {
  /** Appointments endpoint */
  appointmentsEndpoint?: string;
  /** Providers endpoint */
  providersEndpoint?: string;
  /** Telemedicine endpoint */
  telemedicineEndpoint?: string;
  /** Medications endpoint */
  medicationsEndpoint?: string;
  /** Treatments endpoint */
  treatmentsEndpoint?: string;
}

/**
 * Journey-specific plan service configuration
 */
export interface PlanServiceConfig extends ServiceConfig {
  /** Coverage endpoint */
  coverageEndpoint?: string;
  /** Claims endpoint */
  claimsEndpoint?: string;
  /** Benefits endpoint */
  benefitsEndpoint?: string;
  /** Payments endpoint */
  paymentsEndpoint?: string;
  /** Documents endpoint */
  documentsEndpoint?: string;
}

/**
 * Journey-specific rate limit configuration
 */
export interface JourneyRateLimitConfig {
  /** Time window for rate limiting in milliseconds */
  windowMs: number;
  /** Maximum number of requests within the time window */
  max: number;
  /** Message to return when rate limit is exceeded */
  message?: string;
}

/**
 * Journey-specific cache configuration
 */
export interface JourneyCacheConfig {
  /** Default TTL for journey */
  ttl: string;
  /** Journey-specific cache settings */
  settings: Record<string, string>;
}

/**
 * Health journey cache configuration
 */
export interface HealthCacheConfig extends JourneyCacheConfig {
  /** Cache TTL for health metrics */
  metrics: string;
  /** Cache TTL for health goals */
  goals: string;
  /** Cache TTL for medical history */
  medicalHistory: string;
}

/**
 * Care journey cache configuration
 */
export interface CareCacheConfig extends JourneyCacheConfig {
  /** Cache TTL for providers */
  providers: string;
  /** Cache TTL for appointments */
  appointments: string;
  /** Cache TTL for treatments */
  treatments: string;
}

/**
 * Plan journey cache configuration
 */
export interface PlanCacheConfig extends JourneyCacheConfig {
  /** Cache TTL for coverage */
  coverage: string;
  /** Cache TTL for claims status */
  claimsStatus: string;
  /** Cache TTL for benefits */
  benefits: string;
}

/**
 * API versioning configuration
 */
export interface ApiVersionConfig {
  /** Current API version */
  current: string;
  /** Supported API versions */
  supported: string[];
  /** Deprecated API versions */
  deprecated: string[];
  /** Sunset dates for deprecated versions */
  sunsetDate: Record<string, string>;
  /** Compatibility mapping between versions */
  compatibility: Record<string, string[]>;
  /** Package versions */
  packages: Record<string, string>;
  /** Version header name */
  headerName: string;
  /** Default version */
  default: string;
  /** Version format validation regex */
  formatRegex: RegExp;
}

/**
 * Feature flags configuration
 */
export interface FeatureFlagsConfig {
  /** Whether to enable GraphQL federation */
  enableGraphQLFederation: boolean;
  /** Whether to enable tracing */
  enableTracing: boolean;
  /** Whether to enable metrics */
  enableMetrics: boolean;
  /** Whether to enable request logging */
  enableRequestLogging: boolean;
  /** Whether to enable response compression */
  enableResponseCompression: boolean;
  /** Whether to enable journey context */
  enableJourneyContext: boolean;
  /** Breaking changes support features */
  breakingChanges: {
    /** Whether to enable compatibility layer */
    enableCompatibilityLayer: boolean;
    /** Whether to enable version negotiation */
    enableVersionNegotiation: boolean;
    /** Whether to enable deprecation warnings */
    enableDeprecationWarnings: boolean;
    /** Whether to enable sunset notices */
    enableSunsetNotices: boolean;
  };
  /** Journey-specific feature flags */
  journey: {
    /** Health journey feature flags */
    health: {
      /** Whether to enable FHIR integration */
      enableFhirIntegration: boolean;
      /** Whether to enable wearable sync */
      enableWearableSync: boolean;
      /** Whether to enable health metrics aggregation */
      enableHealthMetricsAggregation: boolean;
      /** Whether to enable health insights */
      enableHealthInsights: boolean;
      /** Whether to enable medical history */
      enableMedicalHistory: boolean;
    };
    /** Care journey feature flags */
    care: {
      /** Whether to enable telemedicine */
      enableTelemedicine: boolean;
      /** Whether to enable provider search */
      enableProviderSearch: boolean;
      /** Whether to enable appointment scheduling */
      enableAppointmentScheduling: boolean;
      /** Whether to enable medication tracking */
      enableMedicationTracking: boolean;
      /** Whether to enable treatment plans */
      enableTreatmentPlans: boolean;
    };
    /** Plan journey feature flags */
    plan: {
      /** Whether to enable claims submission */
      enableClaimsSubmission: boolean;
      /** Whether to enable coverage check */
      enableCoverageCheck: boolean;
      /** Whether to enable benefit details */
      enableBenefitDetails: boolean;
      /** Whether to enable payment processing */
      enablePaymentProcessing: boolean;
      /** Whether to enable document upload */
      enableDocumentUpload: boolean;
    };
  };
  /** Gamification feature flags */
  gamification: {
    /** Whether to enable achievements */
    enableAchievements: boolean;
    /** Whether to enable leaderboards */
    enableLeaderboards: boolean;
    /** Whether to enable quests */
    enableQuests: boolean;
    /** Whether to enable rewards */
    enableRewards: boolean;
    /** Whether to enable XP system */
    enableXpSystem: boolean;
  };
}

/**
 * Error codes and messages configuration
 */
export interface ErrorsConfig {
  /** General errors */
  general: {
    /** Internal server error */
    internalServerError: ErrorCodeConfig;
    /** Resource not found error */
    notFound: ErrorCodeConfig;
    /** Bad request error */
    badRequest: ErrorCodeConfig;
    /** Unauthorized error */
    unauthorized: ErrorCodeConfig;
    /** Forbidden error */
    forbidden: ErrorCodeConfig;
    /** Validation error */
    validationError: ErrorCodeConfig;
    /** Service unavailable error */
    serviceUnavailable: ErrorCodeConfig;
    /** Rate limit exceeded error */
    rateLimitExceeded: ErrorCodeConfig;
  };
  /** Authentication errors */
  auth: {
    /** Invalid credentials error */
    invalidCredentials: ErrorCodeConfig;
    /** Token expired error */
    tokenExpired: ErrorCodeConfig;
    /** Invalid token error */
    invalidToken: ErrorCodeConfig;
    /** Account locked error */
    accountLocked: ErrorCodeConfig;
  };
  /** Journey-specific errors */
  journey: {
    /** Health journey errors */
    health: {
      /** Device connection failed error */
      deviceConnectionFailed: ErrorCodeConfig;
      /** Metric validation failed error */
      metricValidationFailed: ErrorCodeConfig;
      /** FHIR integration error */
      fhirIntegrationError: ErrorCodeConfig;
    };
    /** Care journey errors */
    care: {
      /** Appointment conflict error */
      appointmentConflict: ErrorCodeConfig;
      /** Provider unavailable error */
      providerUnavailable: ErrorCodeConfig;
      /** Telemedicine error */
      telemedicineError: ErrorCodeConfig;
    };
    /** Plan journey errors */
    plan: {
      /** Coverage verification failed error */
      coverageVerificationFailed: ErrorCodeConfig;
      /** Claim submission failed error */
      claimSubmissionFailed: ErrorCodeConfig;
      /** Payment processing error */
      paymentProcessingError: ErrorCodeConfig;
    };
  };
  /** Gamification errors */
  gamification: {
    /** Event processing failed error */
    eventProcessingFailed: ErrorCodeConfig;
    /** Achievement not found error */
    achievementNotFound: ErrorCodeConfig;
    /** Reward redemption failed error */
    rewardRedemptionFailed: ErrorCodeConfig;
  };
  /** Notification errors */
  notification: {
    /** Notification delivery failed error */
    deliveryFailed: ErrorCodeConfig;
    /** Notification template not found error */
    templateNotFound: ErrorCodeConfig;
    /** Notification channel unavailable error */
    channelUnavailable: ErrorCodeConfig;
  };
}

/**
 * Error code and message configuration
 */
export interface ErrorCodeConfig {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
}

/**
 * Routes configuration
 */
export interface RoutesConfig {
  /** API version prefix */
  apiPrefix: string;
  /** Health check endpoint */
  health: string;
  /** Documentation endpoints */
  docs: string;
  /** Swagger endpoint */
  swagger: string;
  /** GraphQL endpoint */
  graphql: string;
  /** WebSocket endpoint */
  websocket: string;
  /** Journey-specific routes */
  journey: {
    /** Health journey routes */
    health: JourneyRoutesConfig;
    /** Care journey routes */
    care: JourneyRoutesConfig;
    /** Plan journey routes */
    plan: JourneyRoutesConfig;
  };
  /** Authentication routes */
  auth: {
    /** Base auth route */
    base: string;
    /** Login route */
    login: string;
    /** Register route */
    register: string;
    /** Refresh token route */
    refresh: string;
    /** Logout route */
    logout: string;
    /** Profile route */
    profile: string;
    /** Forgot password route */
    forgotPassword: string;
    /** Reset password route */
    resetPassword: string;
  };
  /** Gamification routes */
  gamification: {
    /** Base gamification route */
    base: string;
    /** Achievements route */
    achievements: string;
    /** Leaderboard route */
    leaderboard: string;
    /** Quests route */
    quests: string;
    /** Rewards route */
    rewards: string;
    /** Profile route */
    profile: string;
  };
  /** Notification routes */
  notifications: {
    /** Base notifications route */
    base: string;
    /** Send notification route */
    send: string;
    /** Notification preferences route */
    preferences: string;
    /** Notification history route */
    history: string;
  };
}

/**
 * Journey-specific routes configuration
 */
export interface JourneyRoutesConfig {
  /** Base journey route */
  base: string;
  /** Additional journey-specific routes */
  [key: string]: string;
}

/**
 * Health journey routes configuration
 */
export interface HealthRoutesConfig extends JourneyRoutesConfig {
  /** Health metrics route */
  metrics: string;
  /** Health goals route */
  goals: string;
  /** Medical devices route */
  devices: string;
  /** Medical history route */
  medicalHistory: string;
  /** Health insights route */
  insights: string;
}

/**
 * Care journey routes configuration
 */
export interface CareRoutesConfig extends JourneyRoutesConfig {
  /** Appointments route */
  appointments: string;
  /** Providers route */
  providers: string;
  /** Telemedicine route */
  telemedicine: string;
  /** Medications route */
  medications: string;
  /** Treatments route */
  treatments: string;
}

/**
 * Plan journey routes configuration
 */
export interface PlanRoutesConfig extends JourneyRoutesConfig {
  /** Coverage route */
  coverage: string;
  /** Claims route */
  claims: string;
  /** Benefits route */
  benefits: string;
  /** Payments route */
  payments: string;
  /** Documents route */
  documents: string;
}

/**
 * Service communication parameters configuration
 */
export interface ServiceCommunicationConfig {
  /** Default service communication settings */
  default: {
    /** Service timeout in milliseconds */
    timeout: number;
    /** Number of retry attempts */
    retryAttempts: number;
    /** Retry delay in milliseconds */
    retryDelay: number;
    /** Circuit breaker configuration */
    circuitBreaker: {
      /** Number of failures before opening circuit */
      failureThreshold: number;
      /** Time in milliseconds before trying again */
      resetTimeout: number;
      /** Whether fallback is available */
      fallbackAvailable: boolean;
    };
    /** Error handling configuration */
    errorHandling: {
      /** Status codes that trigger retry */
      retryStatusCodes: number[];
      /** Status codes that count toward circuit breaking */
      circuitBreakStatusCodes: number[];
      /** Status codes that trigger fallback */
      fallbackStatusCodes: number[];
    };
  };
  /** Auth service communication parameters */
  authService: ServiceCommunicationParams;
  /** Health service communication parameters */
  healthService: ServiceCommunicationParams;
  /** Care service communication parameters */
  careService: ServiceCommunicationParams;
  /** Plan service communication parameters */
  planService: ServiceCommunicationParams;
  /** Gamification service communication parameters */
  gamificationEngine: ServiceCommunicationParams;
  /** Notification service communication parameters */
  notificationService: ServiceCommunicationParams;
}

/**
 * Service communication parameters
 */
export interface ServiceCommunicationParams {
  /** Service name */
  name: string;
  /** Service port */
  port: number;
  /** Service timeout in milliseconds */
  timeout: number;
  /** Whether the service is critical */
  critical: boolean;
  /** Base path for the service */
  basePath: string;
  /** Path for health checks */
  healthCheckPath: string;
  /** Service version */
  version: string;
  /** Journey ID (for journey services) */
  journeyId?: string;
  /** Service endpoints */
  endpoints?: Record<string, string>;
  /** Retry attempts */
  retryAttempts?: number;
  /** Circuit breaker configuration */
  circuitBreaker?: {
    /** Number of failures before opening circuit */
    failureThreshold: number;
    /** Time in milliseconds before trying again */
    resetTimeout: number;
    /** Whether fallback is available */
    fallbackAvailable: boolean;
  };
}

/**
 * Timeout configuration
 */
export interface TimeoutConfig {
  /** Default request timeout for external services */
  request: number;
  /** Default timeout for GraphQL operations */
  graphql: number;
  /** Default timeout for WebSocket connections */
  websocket: number;
  /** Default timeout for health checks */
  healthCheck: number;
  /** Journey-specific timeouts */
  journey: {
    /** Health journey timeout */
    health: number;
    /** Care journey timeout */
    care: number;
    /** Plan journey timeout */
    plan: number;
  };
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  /** CORS security configuration */
  cors: {
    /** Allowed origins for CORS */
    allowedOrigins: string[];
    /** Allowed methods for CORS */
    allowedMethods: string[];
    /** Allowed headers for CORS */
    allowedHeaders: string[];
    /** Exposed headers for CORS */
    exposedHeaders: string[];
    /** Max age for CORS preflight requests */
    maxAge: number;
    /** Whether to allow credentials in CORS requests */
    credentials: boolean;
  };
  /** Helmet security configuration */
  helmet: {
    /** Content Security Policy configuration */
    contentSecurityPolicy: {
      /** CSP directives */
      directives: Record<string, string[]>;
    };
    /** HTTP Strict Transport Security configuration */
    hsts: {
      /** Max age for HSTS in seconds */
      maxAge: number;
      /** Whether to include subdomains in HSTS */
      includeSubDomains: boolean;
    };
  };
  /** Rate limiter security configuration */
  rateLimiter: {
    /** Whether to skip failed requests in rate limiting */
    skipFailedRequests: boolean;
    /** Whether to skip successful requests in rate limiting */
    skipSuccessfulRequests: boolean;
    /** Whether to include headers in rate limiting responses */
    headers: boolean;
    /** Whether to include legacy headers in rate limiting responses */
    legacyHeaders: boolean;
    /** Whether to use the draft Polli RRL spec */
    draftPolliRrlSpec: boolean;
  };
}

/**
 * GraphQL specific configuration
 */
export interface GraphQLSpecificConfig {
  /** GraphQL path */
  path: string;
  /** Whether to enable GraphQL Playground */
  playground: boolean;
  /** Whether to enable GraphQL introspection */
  introspection: boolean;
  /** Whether to enable GraphQL debug mode */
  debug: boolean;
  /** GraphQL complexity configuration */
  complexity: {
    /** Maximum query cost */
    maxCost: number;
    /** Cost per variable */
    variablesCost: number;
    /** Cost per object */
    objectCost: number;
    /** Cost multiplier for lists */
    listFactor: number;
    /** Cost factor for query depth */
    depthCostFactor: number;
  };
  /** GraphQL persisted queries configuration */
  persistedQueries: {
    /** Whether to enable persisted queries */
    enabled: boolean;
    /** TTL for persisted queries in seconds */
    ttl: number;
  };
}