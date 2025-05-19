# Gamification Engine Utilities

## Overview

This directory contains utility functions and services used throughout the gamification engine to standardize common operations, ensure consistent error handling, and provide reusable functionality across different components.

## Key Utilities

### Event Processing Utility

The `event-processing.util.ts` file provides standardized event handling, schema validation, and event transformation within the gamification engine. It ensures consistent processing of events from all journeys and integrates with the retry mechanism for resilient event handling.

#### Key Features

- **Event Validation**: Validates events against standardized schemas defined in `@austa/interfaces`
- **Event Enrichment**: Adds metadata and tracking information to events
- **Journey-Specific Handling**: Provides specialized handling for health, care, and plan journey events
- **Retry Mechanism**: Integrates with the retry service for resilient event processing
- **Type Safety**: Implements strong typing for all event operations

#### Usage Example

```typescript
// Inject the utility in your service
constructor(private readonly eventProcessingUtil: EventProcessingUtil) {}

// Validate an event
if (this.eventProcessingUtil.validateEvent(event)) {
  // Event is valid, proceed with processing
}

// Enrich an event with metadata
const enrichedEvent = this.eventProcessingUtil.enrichEvent(event);

// Process an event with retry capabilities
const result = await this.eventProcessingUtil.processWithRetry(
  enrichedEvent,
  (e) => this.processEvent(e)
);

// Check if an event belongs to a specific journey
if (this.eventProcessingUtil.isHealthEvent(event)) {
  // Handle health journey event
}
```

### Other Utilities

- **date-time.util.ts**: Date and time utilities for managing achievement deadlines, quest durations, and reward expiration
- **format.util.ts**: Data formatting utilities for standardizing event formats and normalizing achievement data
- **circuit-breaker.util.ts**: Circuit breaker pattern implementation for managing failures in external dependencies
- **logging.util.ts**: Gamification-specific logging utilities with correlation IDs for tracing events
- **validation.util.ts**: Validation utilities using Zod/class-validator for consistent validation patterns
- **retry.util.ts**: Retry utilities with configurable strategies and exponential backoff
- **error-handling.util.ts**: Error handling framework with journey-specific error classification

## Integration with Other Services

These utilities are designed to work seamlessly with other services in the AUSTA SuperApp, particularly:

- **@austa/interfaces**: For standardized type definitions and schemas
- **@austa/events**: For event production and consumption
- **@austa/logging**: For structured logging
- **@austa/tracing**: For distributed tracing
- **@austa/errors**: For standardized error handling

## Best Practices

1. Always use these utilities instead of implementing custom solutions for common operations
2. Ensure proper error handling by using the provided error handling utilities
3. Leverage the retry mechanisms for operations that may fail transiently
4. Use the journey-specific utilities to maintain consistent handling across all journeys
5. Keep the utilities stateless to ensure they can be safely used across multiple services