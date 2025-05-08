# Retry Module

The Retry Module provides robust retry functionality for failed notification operations in the AUSTA SuperApp notification service. It implements multiple retry strategies, handles scheduling and processing of retries, and integrates with a dead-letter queue for exhausted retry attempts.

## Features

- **Multiple Retry Policies**: Supports fixed interval, exponential backoff, and composite retry strategies
- **Policy Registry**: Allows registering and retrieving retry policies by name
- **Channel-Specific Configuration**: Different retry configurations for push, email, SMS, and in-app notifications
- **Error Classification**: Determines appropriate retry policy based on error type and channel
- **Dead-Letter Queue Integration**: Moves failed notifications to DLQ after exhausting retry attempts
- **Structured Logging**: Comprehensive logging with context for observability
- **Distributed Tracing**: Integration with OpenTelemetry for distributed tracing
- **Scheduled Processing**: Cron job to process scheduled retries

## Usage

### Basic Usage

```typescript
// Inject the RetryService in your service
constructor(private readonly retryService: RetryService) {}

// Create a retryable operation
const operation: IRetryableOperation = {
  execute: async () => {
    // Your operation logic here
    await this.sendNotification(userId, content);
  },
  getPayload: () => ({
    userId,
    content,
    // Additional data
  }),
  getMetadata: () => ({
    notificationId,
    type,
    // Additional metadata
  })
};

// Schedule a retry when an operation fails
try {
  await operation.execute();
} catch (error) {
  await this.retryService.scheduleRetry(
    operation,
    error,
    {
      notificationId,
      userId,
      channel: 'push',
      attemptCount: 0
    }
  );
}
```

### Custom Retry Policies

```typescript
// Create a custom retry policy
const customPolicy: IRetryPolicy = {
  calculateNextRetryTime: (attemptCount, options) => {
    // Your custom logic to calculate next retry time
    return Date.now() + 5000 * Math.pow(2, attemptCount);
  },
  shouldRetry: (error, attemptCount, options) => {
    // Your custom logic to determine if retry should be attempted
    return attemptCount < options.maxRetries && isTransientError(error);
  },
  getName: () => 'custom-policy'
};

// Register the custom policy
retryService.registerPolicy('custom-policy', customPolicy);

// Use the custom policy
const policy = retryService.getPolicy('custom-policy');
```

## Architecture

The Retry Module consists of the following components:

- **RetryService**: Core service that manages retry policies and schedules retries
- **DlqService**: Service for managing the dead-letter queue
- **RetryPolicies**: Implementations of different retry strategies
- **Interfaces**: Contracts for retry operations, policies, and options

## Integration with NotificationsService

The RetryService is designed to be used by the NotificationsService to handle failed notification deliveries. When a notification fails to be delivered, the NotificationsService can use the RetryService to schedule a retry with the appropriate policy based on the channel and error type.

## Error Handling

The Retry Module implements a comprehensive error handling strategy:

1. **Error Detection**: Captures errors during notification delivery
2. **Error Classification**: Determines if the error is transient and retryable
3. **Retry Scheduling**: Schedules retries with appropriate backoff
4. **DLQ Integration**: Moves to DLQ after exhausting retries
5. **Observability**: Logs and traces for monitoring and debugging

## Monitoring and Observability

The Retry Module integrates with the platform's monitoring and observability infrastructure:

- **Structured Logging**: Comprehensive logging with context
- **Distributed Tracing**: Integration with OpenTelemetry
- **Metrics**: Tracking of retry attempts, success rates, and DLQ entries

## Configuration

The Retry Module can be configured through environment variables:

- `RETRY_DEFAULT_POLICY`: Default retry policy to use (default: exponential-backoff)
- `RETRY_MAX_ATTEMPTS`: Maximum number of retry attempts (default: varies by channel)
- `RETRY_INITIAL_DELAY`: Initial delay in milliseconds (default: varies by channel)
- `RETRY_MAX_DELAY`: Maximum delay in milliseconds (default: varies by channel)
- `RETRY_BACKOFF_FACTOR`: Factor for exponential backoff (default: 2)
- `RETRY_JITTER_ENABLED`: Whether to add jitter to retry delays (default: true)