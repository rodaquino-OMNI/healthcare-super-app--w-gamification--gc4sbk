# Kafka Testing Environment

## Overview

This directory contains utilities for testing Kafka-based event processing in the AUSTA SuperApp. The main components are:

- `kafka-test-environment.js`: A custom Jest test environment for Kafka testing
- `global-teardown.js`: Global teardown script for cleaning up Kafka resources
- `test-events-producer.ts`: Utility for generating test events
- `jest-e2e.config.js`: Configuration for end-to-end tests

## Using the Kafka Test Environment

### Configuration

To use the Kafka test environment in your tests, you need to configure Jest to use it. You can do this in your Jest configuration file:

```js
// jest.config.js
module.exports = {
  testEnvironment: './test/kafka-test-environment.js',
  // Optional: Configure the environment
  testEnvironmentOptions: {
    // Kafka-specific options
    kafkaBrokerPort: 9092,
    zookeeperPort: 2181,
    topicPrefix: 'test',
    autoCreateTopics: true,
    cleanupTopics: true,
  },
  // Global teardown to clean up resources
  globalTeardown: './test/global-teardown.js',
};
```

Alternatively, you can specify the test environment for individual test files using a docblock comment:

```js
/**
 * @jest-environment ./test/kafka-test-environment.js
 */
describe('Kafka tests', () => {
  // Your tests here
});
```

### Creating Test Topics

The Kafka test environment provides a global `createTestTopic` function that you can use to create test topics with unique names:

```js
const topicName = global.createTestTopic('my-test', { partitions: 3 });
```

This will create a topic with a name like `test-my-test-a1b2c3d4` and register it for automatic cleanup after your tests.

### Registering Kafka Clients

To ensure proper cleanup of Kafka clients, register them with the test environment:

```js
const producer = kafka.producer();
await producer.connect();

// Register the producer for cleanup
global.registerKafkaClient(producer, () => producer.disconnect());
```

### Example Test

```js
/**
 * @jest-environment ./test/kafka-test-environment.js
 */
const { Kafka } = require('kafkajs');

describe('Kafka event processing', () => {
  let kafka;
  let producer;
  let consumer;
  let testTopic;

  beforeAll(async () => {
    // Create Kafka client
    kafka = new Kafka({
      clientId: 'test-client',
      brokers: [global.__KAFKA_BROKER__],
    });

    // Create producer
    producer = kafka.producer();
    await producer.connect();
    global.registerKafkaClient(producer, () => producer.disconnect());

    // Create consumer
    consumer = kafka.consumer({ groupId: 'test-group' });
    await consumer.connect();
    global.registerKafkaClient(consumer, () => consumer.disconnect());

    // Create test topic
    testTopic = global.createTestTopic('event-test');
    await consumer.subscribe({ topic: testTopic, fromBeginning: true });
  });

  test('should process messages correctly', async () => {
    // Arrange
    const messages = [];
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        messages.push({
          topic,
          partition,
          value: message.value.toString(),
        });
      },
    });

    // Act
    await producer.send({
      topic: testTopic,
      messages: [
        { value: JSON.stringify({ event: 'test-event', data: { id: 1 } }) },
      ],
    });

    // Assert
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for message processing
    expect(messages).toHaveLength(1);
    expect(JSON.parse(messages[0].value)).toEqual({ event: 'test-event', data: { id: 1 } });
  });
});
```

## Troubleshooting

### Docker Issues

The Kafka test environment requires Docker to be installed and running. If you encounter issues with Docker, check:

1. Docker is installed and running
2. You have permission to run Docker commands
3. The ports specified in your configuration are available

### Kafka Connection Issues

If your tests can't connect to Kafka:

1. Check that the Kafka container is running: `docker ps | grep kafka-test`
2. Verify the broker port is correct and matches your configuration
3. Check the logs for the Kafka container: `docker logs kafka-test`

### Cleanup Issues

If resources aren't being cleaned up properly:

1. Manually stop and remove the containers: `docker stop kafka-test zookeeper-test && docker rm kafka-test zookeeper-test`
2. Delete the client registry file: `rm .kafka-clients-registry.json`