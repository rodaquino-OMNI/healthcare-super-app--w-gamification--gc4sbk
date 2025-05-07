/**
 * GraphQL Resolvers Aggregator
 * 
 * This file dynamically imports resolvers from various feature areas and combines
 * them into a single object for the API Gateway. It helps avoid circular dependency
 * issues by keeping resolvers modular and domain-specific.
 */
import { merge } from 'lodash'; // lodash 4.17.21

// Import services using standardized path aliases
import { AuthService } from '@app/auth';
import { HealthService } from '@app/health';
import { AppointmentsService } from '@app/care';
import { ClaimsService } from '@app/plan';

// Import error handling utilities from @austa/errors
import { retryWithBackoff, CircuitBreaker } from '@austa/errors/utils';

// Import interfaces for type-safe request/response models
import { 
  AuthServiceOptions, 
  HealthServiceOptions,
  CareServiceOptions,
  PlanServiceOptions 
} from '@austa/interfaces/common';

// Initialize service instances with enhanced error handling
const authServiceOptions: AuthServiceOptions = {
  retryConfig: {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 1000
  },
  circuitBreakerConfig: {
    failureThreshold: 5,
    resetTimeoutMs: 30000
  }
};

const healthServiceOptions: HealthServiceOptions = {
  retryConfig: {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 1000
  },
  cacheConfig: {
    ttlMs: 60000 // 1 minute cache for health metrics
  }
};

const careServiceOptions: CareServiceOptions = {
  retryConfig: {
    maxAttempts: 2,
    initialDelayMs: 200,
    maxDelayMs: 1000
  },
  fallbackConfig: {
    enabled: true,
    gracefulDegradation: true
  }
};

const planServiceOptions: PlanServiceOptions = {
  retryConfig: {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 2000
  },
  transactionConfig: {
    timeout: 5000,
    isolation: 'serializable'
  }
};

// Initialize service instances with enhanced error handling options
const authService = new AuthService(authServiceOptions);
const healthService = new HealthService(healthServiceOptions);
const appointmentsService = new AppointmentsService(careServiceOptions);
const claimsService = new ClaimsService(planServiceOptions);

// Import resolvers from different domains using standardized path resolution
// Each module exports resolver functions for its specific domain
import { authResolvers } from './resolvers/auth';
import { healthResolvers } from './resolvers/health';
import { careResolvers } from './resolvers/care';
import { planResolvers } from './resolvers/plan';
import { gamificationResolvers } from './resolvers/gamification';

// Create circuit breakers for critical resolver operations
const authCircuitBreaker = new CircuitBreaker({
  name: 'auth-service',
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  onOpen: () => console.error('Auth service circuit breaker opened'),
  onClose: () => console.info('Auth service circuit breaker closed'),
  onHalfOpen: () => console.info('Auth service circuit breaker half-open')
});

// Use the service instances to initialize resolvers with enhanced error handling
const authResolverMap = authResolvers(authService, { circuitBreaker: authCircuitBreaker });
const healthResolverMap = healthResolvers(healthService, { 
  retry: (fn) => retryWithBackoff(fn, healthServiceOptions.retryConfig)
});
const careResolverMap = careResolvers(appointmentsService, {
  retry: (fn) => retryWithBackoff(fn, careServiceOptions.retryConfig),
  fallback: careServiceOptions.fallbackConfig
});
const planResolverMap = planResolvers(claimsService, {
  retry: (fn) => retryWithBackoff(fn, planServiceOptions.retryConfig),
  transaction: planServiceOptions.transactionConfig
});

// Merge all resolvers into a single object to ensure no conflicts
// This creates a unified resolver map that covers all GraphQL types
const combinedResolvers = merge(
  {},
  authResolverMap,
  healthResolverMap,
  careResolverMap,
  planResolverMap,
  gamificationResolvers
);

// Export the resolver array
// Apollo Server accepts an array of resolver objects that it merges internally
export const resolvers = [combinedResolvers];