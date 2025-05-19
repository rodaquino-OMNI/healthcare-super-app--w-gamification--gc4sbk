# AUSTA SuperApp Notification Service

The AUSTA SuperApp Notification Service is a specialized microservice that delivers user communications across multiple channels with journey-specific formatting and prioritization. This service is responsible for delivering personalized notifications to users based on their preferences and the operational needs of the AUSTA platform.

## Prerequisites

- Node.js 18.x or higher

- PostgreSQL 14.x or higher

- Redis (for rate limiting and WebSocket adapter)

- Amazon SES or SMTP server (for email notifications)

- Firebase Cloud Messaging account (for push notifications)

- Twilio account (for SMS notifications)

- Kafka (for event processing and retry mechanisms)

## Architecture Overview

The Notification Service follows a modular architecture with the following components:

- **Notification Controller**: REST API for sending notifications and querying delivery status

- **Preferences Controller**: Manage user notification preferences

- **Notification Service**: Core business logic for notification processing and routing

- **Channel Services**: Specialized services for each delivery channel (email, SMS, push, in-app)

- **Template Service**: Manages notification templates with personalization capabilities

- **WebSocket Gateway**: Handles real-time in-app notification delivery

- **Preference Service**: Manages user notification preferences

- **Retry Service**: Implements exponential backoff retry policies for failed notifications

- **Dead Letter Queue (DLQ)**: Captures and stores failed notification events for later processing

- **Kafka Integration**: Reliable event-based notification routing and delivery tracking

- **Standardized Schemas**: Type-safe notification payloads using @austa/interfaces package

## Installation

```bash
# Clone the repository (if not already done)
git clone https://github.com/yourusername/austa-superapp.git

# Navigate to the notification service directory
cd austa-superapp/src/backend/notification-service

# Install dependencies
npm install
```

## Configuration

The service uses environment variables for configuration. Create a `.env` file in the root directory with the following variables:

```
# Application
PORT=3003
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/austa_notifications

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=1d

# Email (Amazon SES)
EMAIL_PROVIDER=ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
EMAIL_FROM=notifications@austa.com.br

# Push Notifications (Firebase)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-phone-number

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=notification-service
KAFKA_GROUP_ID=notification-consumers

# Retry Configuration
RETRY_MAX_ATTEMPTS=5
RETRY_INITIAL_INTERVAL=1000
RETRY_MULTIPLIER=2
RETRY_MAX_INTERVAL=60000

# Dead Letter Queue
DLQ_ENABLED=true
DLQ_TOPIC=notification-dlq
DLQ_MAX_RETRIES=3
```

Alternatively, you can use the configuration service that loads values from environment variables, configuration files, or environment-specific sources.

## Running the Service

### Development Mode

```bash
# Run in development mode with hot-reload
npm run start:dev
```

### Production Mode

```bash
# Build the application
npm run build

# Run in production mode
npm run start:prod
```

### Docker Support

```bash
# Build Docker image
docker build -t austa-notification-service .

# Run Docker container
docker run -p 3003:3003 --env-file .env austa-notification-service
```

## API Endpoints

### Notifications API

- `POST /api/notifications` - Send a new notification

- `GET /api/notifications` - Get notifications (with filtering options)

- `GET /api/notifications/:id` - Get notification details by ID

- `GET /api/notifications/status/:id` - Get notification delivery status

### Preferences API

- `GET /api/preferences/:userId` - Get user notification preferences

- `PATCH /api/preferences/:userId` - Update user notification preferences

- `GET /api/preferences/:userId/channels` - Get user's enabled notification channels

### Retry and DLQ API

- `GET /api/retry/failed` - Get list of failed notifications in DLQ

- `POST /api/retry/:id` - Retry a specific failed notification

- `POST /api/retry/batch` - Retry a batch of failed notifications

- `GET /api/retry/stats` - Get retry statistics and metrics

## Usage Examples

### Sending a Notification

```typescript
// Example: Send a notification
const notification = {
  userId: '123e4567-e89b-12d3-a456-426614174000',
  templateId: 'appointment-reminder',
  journeyType: 'care',
  priority: 'high',
  data: {
    provider: 'Dr. Silva',
    time: '14:00',
    date: '2023-04-15',
    appointmentId: '5678'
  },
  channels: ['push', 'email', 'in-app'],
  // New: Specify fallback channels in order of preference
  fallbackChannels: ['sms', 'email']
};

const response = await fetch('http://localhost:3003/api/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify(notification)
});

const result = await response.json();
console.log(result);
```

### WebSocket Connection for Real-time Notifications

```typescript
// Client-side code to connect to WebSocket for notifications
import { io } from 'socket.io-client';

const socket = io('http://localhost:3003', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// Listen for notifications
socket.on('notification', (notification) => {
  console.log('New notification received:', notification);
  // Handle the notification in your UI
});

// Subscribe to specific channels
socket.emit('subscribe', { userId: 'user-123' });
```

### Monitoring Failed Notifications

```typescript
// Example: Get failed notifications from DLQ
const response = await fetch('http://localhost:3003/api/retry/failed', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const failedNotifications = await response.json();
console.log(failedNotifications);

// Example: Retry a specific failed notification
const retryResponse = await fetch(`http://localhost:3003/api/retry/${failedNotificationId}`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const retryResult = await retryResponse.json();
console.log(retryResult);
```

## Notification Channels

The service supports the following notification channels:

### Email

Uses Amazon SES or SMTP to send email notifications with HTML templates.

### Push Notifications

Uses Firebase Cloud Messaging (FCM) to send push notifications to mobile devices.

### SMS

Uses Twilio to send SMS notifications for critical alerts and time-sensitive information.

### In-App Notifications

Uses WebSockets to deliver real-time notifications within the application.

## Channel Fallback Mechanism

The notification service implements an enhanced channel fallback mechanism that automatically attempts delivery through alternative channels when the primary channel fails. The fallback process works as follows:

1. **Primary Channel Attempt**: The service first attempts to deliver the notification through the primary specified channels.

2. **Failure Detection**: If delivery fails (e.g., push notification fails because the device is offline), the service detects the failure.

3. **Fallback Channel Selection**: The service selects the next available channel from the fallback channels list, considering:
   - User preferences for notification channels
   - Notification priority and urgency
   - Channel availability and reliability

4. **Automatic Retry**: The notification is automatically sent through the fallback channel with appropriate formatting.

5. **Delivery Tracking**: All delivery attempts are tracked, including which channel successfully delivered the notification.

This ensures that critical notifications reach users even when their preferred channel is unavailable.

## Retry and Dead Letter Queue Mechanism

The notification service implements a robust retry mechanism with dead letter queues (DLQ) to handle failed notification deliveries:

### Retry Mechanism

1. **Exponential Backoff**: Failed notification attempts are retried with increasing time intervals between attempts, following an exponential backoff pattern:
   - First retry: Initial interval (e.g., 1 second)
   - Second retry: Initial interval × multiplier (e.g., 2 seconds)
   - Third retry: Previous interval × multiplier (e.g., 4 seconds)
   - And so on, up to a maximum interval

2. **Configurable Parameters**:
   - Maximum retry attempts
   - Initial retry interval
   - Backoff multiplier
   - Maximum retry interval

3. **Retry Policies**: Different retry policies can be applied based on notification type, priority, and failure reason.

### Dead Letter Queue (DLQ)

1. **Failed Notification Capture**: After exhausting all retry attempts, failed notifications are moved to a dead letter queue.

2. **Notification Metadata**: The DLQ stores the original notification along with:
   - Failure reason and error details
   - Timestamp of failure
   - Number of retry attempts made
   - Channel that failed

3. **Manual Intervention**: Operators can view failed notifications in the DLQ and manually trigger retries or take corrective action.

4. **Batch Processing**: Support for processing batches of failed notifications from the DLQ.

### Monitoring and Alerting

1. **Retry Metrics**: The service tracks and exposes metrics on retry attempts, success rates, and failure patterns.

2. **DLQ Monitoring**: Alerts are generated when the DLQ size exceeds configurable thresholds.

3. **Performance Impact**: The retry mechanism is designed to minimize performance impact on the main notification processing pipeline.

This comprehensive retry and DLQ mechanism ensures reliable notification delivery while providing visibility into delivery failures.

## Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run test coverage
npm run test:cov
```

## Design Considerations

- **Journey Context**: Notifications include journey context (health, care, plan) for consistent theming

- **Prioritization**: Critical notifications (like care reminders) are prioritized over informational messages

- **User Control**: Users have granular control over notification preferences by type and channel

- **Delivery Guarantees**: Critical notifications use multiple channels with delivery confirmation

- **Compliance**: All communications comply with LGPD (Brazilian General Data Protection Law)

- **Standardized Schemas**: All notification payloads follow standardized schemas defined in @austa/interfaces

- **Resilience**: The service is designed to handle temporary failures with robust retry mechanisms

- **Observability**: Comprehensive monitoring and logging for notification delivery tracking

## License

Copyright (c) 2023 AUSTA SuperApp. All rights reserved.

## Features

- **Multi-channel delivery**: Send notifications via email, SMS, push notifications, and in-app messages

- **Template-based notifications**: Use dynamic templates with personalization capabilities

- **User preferences**: Respect user notification preferences by channel and notification type

- **Journey-specific theming**: Apply visual styling consistent with the Health, Care, and Plan journeys

- **Prioritization**: Intelligent message prioritization to prevent notification fatigue

- **Real-time notifications**: WebSocket-based delivery for immediate in-app notifications

- **Delivery tracking**: Monitor notification delivery status and user interactions

- **Rate limiting**: Prevent notification flooding with configurable rate limits

- **Standardized notification schemas**: Type-safe notification payloads using @austa/interfaces package

- **Reliable retry mechanisms**: Exponential backoff retry policies for failed notifications

- **Dead-letter queues**: Capture and manage failed notification events for later processing

- **Enhanced channel fallback**: Automatic delivery through alternative channels when primary channel fails