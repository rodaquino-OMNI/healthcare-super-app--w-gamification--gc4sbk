# Gamification Engine Utilities

This directory contains utility functions and classes used throughout the gamification engine to provide common functionality and ensure consistent implementation patterns.

## Available Utilities

### Circuit Breaker (`circuit-breaker.util.ts`)

Implements the circuit breaker pattern for managing failures in external dependencies and services. Prevents cascading failures by automatically detecting repeated failures and temporarily disabling problematic operations with fallback mechanisms.

#### Features

- Configurable failure thresholds for opening the circuit
- Automatic recovery with half-open state for testing service health
- Fallback mechanism for graceful degradation of features
- Integration with monitoring for tracking circuit breaker status
- Method decorators for easy application to service methods

#### Usage Examples

**Basic Usage:**

```typescript
import { createCircuitBreaker } from '@app/common/utils';

// Create a circuit breaker with default options
const breaker = createCircuitBreaker('external-service');

// Execute a function with circuit breaker protection
try {
  const result = await breaker.execute(async () => {
    // Call to external service that might fail
    return await externalService.getData();
  });
  // Process result
} catch (error) {
  // Handle error (could be CircuitBreakerOpenError or original error)
}
```

**With Fallback:**

```typescript
import { createCircuitBreaker } from '@app/common/utils';

// Create a circuit breaker with custom options
const breaker = createCircuitBreaker('payment-service', {
  failureThreshold: 3,     // Open after 3 failures
  resetTimeout: 10000,      // Try again after 10 seconds
  successThreshold: 2,      // Close after 2 successful calls
  callTimeout: 5000         // Timeout calls after 5 seconds
});

// Execute with fallback
const result = await breaker.executeWithFallback(
  async () => {
    return await paymentService.processPayment(amount);
  },
  async (error) => {
    // Fallback logic when circuit is open or call fails
    return { success: false, error: error.message };
  }
);
```

**Using Decorators:**

```typescript
import { WithCircuitBreaker, WithCircuitBreakerFallback } from '@app/common/utils';

@Injectable()
export class AchievementService {
  constructor(private readonly externalService: ExternalService) {}

  // Apply circuit breaker to method
  @WithCircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 30000,
    successThreshold: 2
  })
  async getAchievementData(userId: string): Promise<AchievementData> {
    return this.externalService.fetchAchievements(userId);
  }

  // Apply circuit breaker with fallback to method
  @WithCircuitBreakerFallback(
    {
      failureThreshold: 3,
      resetTimeout: 30000,
      successThreshold: 2
    },
    async (error, userId: string) => {
      // Fallback implementation
      return { achievements: [], lastUpdated: new Date() };
    }
  )
  async getUserRewards(userId: string): Promise<RewardData> {
    return this.externalService.fetchRewards(userId);
  }
}
```

### Date Time (`date-time.util.ts`)

Provides date and time calculation utilities for the gamification engine, essential for managing achievement deadlines, quest durations, and reward expiration.

### Format (`format.util.ts`)

Provides data formatting and transformation utilities for standardizing event formats, normalizing achievement data, and formatting user-facing notifications.

### Logging (`logging.util.ts`)

Gamification-specific logging utilities with correlation IDs that trace events across journey services.

### Event Processing (`event-processing.util.ts`)

Utilities for standardized event handling, schema validation, and event transformation within the gamification engine.

### Validation (`validation.util.ts`)

Validation utilities using Zod/class-validator for the gamification engine to ensure data integrity.

### Retry (`retry.util.ts`)

Configurable retry strategies with exponential backoff for handling transient failures in event processing and external service calls.

### Error Handling (`error-handling.util.ts`)

Comprehensive error handling framework with journey-specific error classification, standardized error codes, and context enrichment.