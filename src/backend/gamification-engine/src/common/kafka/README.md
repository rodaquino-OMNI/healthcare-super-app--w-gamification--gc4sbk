# Kafka Utilities for Gamification Engine

This directory contains utilities for working with Kafka in the gamification engine.

## MessageSerializer

The `MessageSerializer` class provides type-safe serialization and deserialization of Kafka messages with schema validation against `@austa/interfaces` types.

### Features

- Type-safe serialization with TypeScript generics
- Schema validation against `@austa/interfaces`
- Consistent error handling for malformed messages
- Header preservation and transformation
- Compression options for large messages

### Usage

#### Serializing an event

```typescript
import { MessageSerializer } from '../common/kafka';
import { GamificationEvent } from '@austa/interfaces/gamification';

// Create an instance of the serializer
const serializer = new MessageSerializer();

// Create an event
const event: GamificationEvent = {
  eventId: 'event-123',
  type: 'HEALTH_METRIC_RECORDED',
  timestamp: new Date().toISOString(),
  source: 'health-service',
  version: '1.0.0',
  payload: {
    userId: 'user-123',
    metricType: 'STEPS',
    value: 10000,
    unit: 'count',
    recordedAt: new Date().toISOString(),
  },
  metadata: {
    correlationId: 'corr-123',
  },
};

// Serialize the event
const message = await serializer.serialize(event, {
  compress: true,
  headers: {
    'x-source-service': 'health-service',
  },
});

// Send the message to Kafka
await kafkaProducer.send({
  topic: 'health-metrics',
  messages: [message],
});
```

#### Deserializing a message

```typescript
import { MessageSerializer } from '../common/kafka';
import { GamificationEvent } from '@austa/interfaces/gamification';

// Create an instance of the serializer
const serializer = new MessageSerializer();

// In a Kafka consumer
const consumer = kafka.consumer({ groupId: 'gamification-group' });

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    try {
      // Deserialize the message
      const event = await serializer.deserialize<GamificationEvent>(message);

      // Process the event
      console.log(`Processing event: ${event.type}`);
      console.log(`Payload: ${JSON.stringify(event.payload)}`);

      // Handle the event based on its type
      switch (event.type) {
        case 'HEALTH_METRIC_RECORDED':
          // Process health metric
          break;
        case 'APPOINTMENT_BOOKED':
          // Process appointment
          break;
        // ... other event types
      }
    } catch (error) {
      console.error('Failed to process message', error);
      // Handle the error (e.g., send to dead letter queue)
    }
  },
});
```

### Compression

The `MessageSerializer` automatically compresses messages that exceed a configurable size threshold (default: 10KB) using gzip compression. This helps reduce bandwidth usage and Kafka storage requirements for large messages.

You can configure compression options when serializing:

```typescript
const message = await serializer.serialize(event, {
  compress: true,                // Enable/disable compression
  compressionThreshold: 5120,    // Custom threshold (5KB)
});
```

### Error Handling

The `MessageSerializer` throws `ValidationError` from the `@austa/errors` package when validation fails. These errors include detailed information about what went wrong, making it easier to debug issues.

```typescript
try {
  const event = await serializer.deserialize<GamificationEvent>(message);
  // Process the event
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Validation error: ${error.message}`);
    // Handle validation error (e.g., send to dead letter queue)
  } else {
    console.error(`Unexpected error: ${error.message}`);
    // Handle other errors
  }
}
```

### Integration with @austa/interfaces

The `MessageSerializer` integrates with the `@austa/interfaces` package to ensure type safety and schema validation. It uses the `GamificationEvent` interface and its derivatives to validate event structure.

This integration ensures that all events flowing through the system conform to the standardized event schemas defined in the technical specification.