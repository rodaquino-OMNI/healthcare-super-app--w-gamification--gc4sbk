import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from '../../src/kafka/kafka.service';
import { KafkaProducer } from '../../src/kafka/kafka.producer';
import { KafkaConsumer } from '../../src/kafka/kafka.consumer';
import { BaseEvent } from '../../src/interfaces/base-event.interface';
import { KafkaEvent } from '../../src/interfaces/kafka-event.interface';
import { EventTypes } from '../../src/dto/event-types.enum';
import { BaseEventDto } from '../../src/dto/base-event.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Integration test for Kafka producer and consumer interactions.
 * 
 * This test suite verifies end-to-end event delivery across different services,
 * including message serialization/deserialization, header propagation, event correlation,
 * and successful message delivery with acknowledgments.
 */
describe('Kafka Producer-Consumer Integration', () => {
  let moduleRef: TestingModule;
  let kafkaService: KafkaService;
  let producer: KafkaProducer;
  let consumer: TestConsumer;
  
  const testTopic = `test-topic-${uuidv4()}`;
  const testGroupId = `test-group-${uuidv4()}`;
  
  // Test event payload
  const testEvent: BaseEventDto = {
    eventId: uuidv4(),
    type: EventTypes.HEALTH.METRIC_RECORDED,
    userId: 'test-user-123',
    timestamp: new Date().toISOString(),
    journey: 'health',
    data: {
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      recordedAt: new Date().toISOString(),
      source: 'integration-test'
    },
    metadata: {
      correlationId: uuidv4(),
      version: '1.0.0',
      source: 'integration-test'
    }
  };

  /**
   * Test consumer implementation that extends the abstract KafkaConsumer class.
   * Used to verify message consumption in tests.
   */
  class TestConsumer extends KafkaConsumer {
    private receivedMessages: KafkaEvent[] = [];
    private messagePromises: Array<{
      resolve: (value: KafkaEvent) => void;
      reject: (error: Error) => void;
    }> = [];

    constructor(kafkaService: KafkaService) {
      super(kafkaService);
    }

    /**
     * Process a received message and store it for test verification.
     */
    async processMessage(message: KafkaEvent): Promise<void> {
      this.receivedMessages.push(message);
      
      // Resolve any pending promises waiting for messages
      if (this.messagePromises.length > 0) {
        const promise = this.messagePromises.shift();
        promise?.resolve(message);
      }
    }

    /**
     * Wait for a specific number of messages to be received.
     */
    async waitForMessages(count: number = 1, timeoutMs: number = 10000): Promise<KafkaEvent[]> {
      if (this.receivedMessages.length >= count) {
        return this.receivedMessages.slice(0, count);
      }

      return new Promise<KafkaEvent[]>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Timed out waiting for ${count} messages. Received only ${this.receivedMessages.length}`));
        }, timeoutMs);

        const checkMessages = () => {
          if (this.receivedMessages.length >= count) {
            clearTimeout(timeout);
            resolve(this.receivedMessages.slice(0, count));
          } else {
            // Create a promise for the next message
            const messagePromise = new Promise<KafkaEvent>((resolveMsg, rejectMsg) => {
              this.messagePromises.push({ resolve: resolveMsg, reject: rejectMsg });
            });

            // When the next message arrives, check again
            messagePromise.then(() => {
              checkMessages();
            }).catch(err => {
              clearTimeout(timeout);
              reject(err);
            });
          }
        };

        checkMessages();
      });
    }

    /**
     * Get all received messages.
     */
    getReceivedMessages(): KafkaEvent[] {
      return [...this.receivedMessages];
    }

    /**
     * Clear all received messages (useful between tests).
     */
    clearMessages(): void {
      this.receivedMessages = [];
    }
  }

  beforeAll(async () => {
    // Create test module with Kafka services
    moduleRef = await Test.createTestingModule({
      providers: [
        KafkaService,
        KafkaProducer,
        {
          provide: 'TEST_CONSUMER',
          useFactory: (kafkaService: KafkaService) => {
            return new TestConsumer(kafkaService);
          },
          inject: [KafkaService]
        }
      ],
    }).compile();

    // Get service instances
    kafkaService = moduleRef.get<KafkaService>(KafkaService);
    producer = moduleRef.get<KafkaProducer>(KafkaProducer);
    consumer = moduleRef.get<TestConsumer>('TEST_CONSUMER');

    // Initialize Kafka connections
    await kafkaService.connect();
    await producer.connect();
    
    // Subscribe consumer to test topic
    await consumer.subscribe({
      topic: testTopic,
      fromBeginning: true,
      groupId: testGroupId
    });

    // Start consuming messages
    await consumer.consume();
  }, 30000); // Increased timeout for Kafka setup

  afterAll(async () => {
    // Disconnect all Kafka clients
    await consumer.disconnect();
    await producer.disconnect();
    await kafkaService.disconnect();
    
    // Close the test module
    await moduleRef.close();
  }, 10000);

  beforeEach(() => {
    // Clear messages before each test
    consumer.clearMessages();
  });

  /**
   * Test basic message delivery from producer to consumer.
   */
  it('should successfully deliver a message from producer to consumer', async () => {
    // Send a test event
    await producer.send({
      topic: testTopic,
      messages: [{
        key: testEvent.userId,
        value: JSON.stringify(testEvent),
        headers: {
          'correlation-id': testEvent.metadata.correlationId,
          'event-type': testEvent.type,
          'journey': testEvent.journey
        }
      }]
    });

    // Wait for the message to be consumed
    const receivedMessages = await consumer.waitForMessages(1, 5000);
    
    // Verify message was received
    expect(receivedMessages).toHaveLength(1);
    
    // Verify message content
    const receivedEvent = JSON.parse(receivedMessages[0].value.toString()) as BaseEvent;
    expect(receivedEvent.eventId).toEqual(testEvent.eventId);
    expect(receivedEvent.type).toEqual(testEvent.type);
    expect(receivedEvent.userId).toEqual(testEvent.userId);
    expect(receivedEvent.journey).toEqual(testEvent.journey);
    
    // Verify data payload
    expect(receivedEvent.data).toEqual(testEvent.data);
  }, 10000);

  /**
   * Test header propagation from producer to consumer.
   */
  it('should properly propagate message headers', async () => {
    // Create event with specific headers to test
    const eventWithHeaders = {
      ...testEvent,
      eventId: uuidv4(),
      metadata: {
        ...testEvent.metadata,
        correlationId: uuidv4(),
        traceId: uuidv4(),
        spanId: uuidv4()
      }
    };

    // Send event with detailed headers
    await producer.send({
      topic: testTopic,
      messages: [{
        key: eventWithHeaders.userId,
        value: JSON.stringify(eventWithHeaders),
        headers: {
          'correlation-id': eventWithHeaders.metadata.correlationId,
          'trace-id': eventWithHeaders.metadata.traceId,
          'span-id': eventWithHeaders.metadata.spanId,
          'event-type': eventWithHeaders.type,
          'journey': eventWithHeaders.journey,
          'source': 'integration-test'
        }
      }]
    });

    // Wait for the message to be consumed
    const receivedMessages = await consumer.waitForMessages(1, 5000);
    
    // Verify headers were properly propagated
    const headers = receivedMessages[0].headers;
    expect(headers['correlation-id']?.toString()).toEqual(eventWithHeaders.metadata.correlationId);
    expect(headers['trace-id']?.toString()).toEqual(eventWithHeaders.metadata.traceId);
    expect(headers['span-id']?.toString()).toEqual(eventWithHeaders.metadata.spanId);
    expect(headers['event-type']?.toString()).toEqual(eventWithHeaders.type);
    expect(headers['journey']?.toString()).toEqual(eventWithHeaders.journey);
    expect(headers['source']?.toString()).toEqual('integration-test');
  }, 10000);

  /**
   * Test batch message processing.
   */
  it('should process multiple messages in batch', async () => {
    const batchSize = 5;
    const batchEvents = Array.from({ length: batchSize }, (_, i) => ({
      ...testEvent,
      eventId: uuidv4(),
      data: {
        ...testEvent.data,
        value: 70 + i,  // Different values for each event
        recordedAt: new Date().toISOString()
      },
      metadata: {
        ...testEvent.metadata,
        correlationId: uuidv4()
      }
    }));

    // Send batch of messages
    await producer.send({
      topic: testTopic,
      messages: batchEvents.map(event => ({
        key: event.userId,
        value: JSON.stringify(event),
        headers: {
          'correlation-id': event.metadata.correlationId,
          'event-type': event.type,
          'journey': event.journey
        }
      }))
    });

    // Wait for all messages to be consumed
    const receivedMessages = await consumer.waitForMessages(batchSize, 10000);
    
    // Verify all messages were received
    expect(receivedMessages).toHaveLength(batchSize);
    
    // Verify each message was processed correctly
    const receivedEvents = receivedMessages.map(msg => 
      JSON.parse(msg.value.toString()) as BaseEvent
    );
    
    // Check that all event IDs from the batch are present in received messages
    const sentEventIds = batchEvents.map(e => e.eventId);
    const receivedEventIds = receivedEvents.map(e => e.eventId);
    
    expect(receivedEventIds.sort()).toEqual(sentEventIds.sort());
  }, 15000);

  /**
   * Test reconnection after broker disconnection.
   * Note: This test simulates reconnection by manually disconnecting and reconnecting.
   */
  it('should reconnect and resume processing after disconnection', async () => {
    // First, send a message and verify it's received
    const firstEvent = {
      ...testEvent,
      eventId: uuidv4(),
      metadata: {
        ...testEvent.metadata,
        correlationId: uuidv4()
      }
    };

    await producer.send({
      topic: testTopic,
      messages: [{
        key: firstEvent.userId,
        value: JSON.stringify(firstEvent),
        headers: {
          'correlation-id': firstEvent.metadata.correlationId,
          'event-type': firstEvent.type,
          'journey': firstEvent.journey
        }
      }]
    });

    // Wait for the first message
    await consumer.waitForMessages(1, 5000);
    consumer.clearMessages();

    // Disconnect and reconnect the consumer
    await consumer.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit
    await consumer.connect();
    await consumer.subscribe({
      topic: testTopic,
      fromBeginning: false, // Only new messages
      groupId: testGroupId
    });
    await consumer.consume();

    // Send another message after reconnection
    const secondEvent = {
      ...testEvent,
      eventId: uuidv4(),
      metadata: {
        ...testEvent.metadata,
        correlationId: uuidv4()
      }
    };

    await producer.send({
      topic: testTopic,
      messages: [{
        key: secondEvent.userId,
        value: JSON.stringify(secondEvent),
        headers: {
          'correlation-id': secondEvent.metadata.correlationId,
          'event-type': secondEvent.type,
          'journey': secondEvent.journey
        }
      }]
    });

    // Wait for the second message
    const receivedAfterReconnect = await consumer.waitForMessages(1, 5000);
    
    // Verify the message received after reconnection
    const receivedEvent = JSON.parse(receivedAfterReconnect[0].value.toString()) as BaseEvent;
    expect(receivedEvent.eventId).toEqual(secondEvent.eventId);
  }, 20000);

  /**
   * Test error handling and retry mechanism.
   * This test simulates a temporary failure in message processing.
   */
  it('should handle errors and retry message processing', async () => {
    // Create a spy on the processMessage method to simulate failures
    const processMessageSpy = jest.spyOn(consumer, 'processMessage');
    
    // Make the first call fail, then succeed on retry
    let attemptCount = 0;
    processMessageSpy.mockImplementation(async (message: KafkaEvent) => {
      attemptCount++;
      if (attemptCount === 1) {
        throw new Error('Simulated processing failure');
      }
      // Original implementation for subsequent calls
      return await TestConsumer.prototype.processMessage.call(consumer, message);
    });

    // Send a test event
    const retryEvent = {
      ...testEvent,
      eventId: uuidv4(),
      metadata: {
        ...testEvent.metadata,
        correlationId: uuidv4()
      }
    };

    await producer.send({
      topic: testTopic,
      messages: [{
        key: retryEvent.userId,
        value: JSON.stringify(retryEvent),
        headers: {
          'correlation-id': retryEvent.metadata.correlationId,
          'event-type': retryEvent.type,
          'journey': retryEvent.journey,
          'retry-count': '0' // Initial retry count
        }
      }]
    });

    // Wait for the message to be processed (with retry)
    // This may take longer due to the retry mechanism
    const receivedMessages = await consumer.waitForMessages(1, 10000);
    
    // Verify message was eventually processed
    expect(receivedMessages).toHaveLength(1);
    expect(attemptCount).toBeGreaterThan(1); // Should have attempted more than once
    
    // Verify the received message is the one we sent
    const receivedEvent = JSON.parse(receivedMessages[0].value.toString()) as BaseEvent;
    expect(receivedEvent.eventId).toEqual(retryEvent.eventId);
    
    // Restore the original implementation
    processMessageSpy.mockRestore();
  }, 15000);

  /**
   * Test correlation ID tracking across services.
   */
  it('should maintain correlation IDs for tracking across services', async () => {
    // Create an event with a specific correlation ID
    const correlationId = uuidv4();
    const correlatedEvent = {
      ...testEvent,
      eventId: uuidv4(),
      metadata: {
        ...testEvent.metadata,
        correlationId,
        parentEventId: uuidv4() // Simulate a parent event
      }
    };

    // Send the event
    await producer.send({
      topic: testTopic,
      messages: [{
        key: correlatedEvent.userId,
        value: JSON.stringify(correlatedEvent),
        headers: {
          'correlation-id': correlatedEvent.metadata.correlationId,
          'parent-event-id': correlatedEvent.metadata.parentEventId,
          'event-type': correlatedEvent.type,
          'journey': correlatedEvent.journey
        }
      }]
    });

    // Wait for the message to be consumed
    const receivedMessages = await consumer.waitForMessages(1, 5000);
    
    // Verify correlation ID was maintained
    const headers = receivedMessages[0].headers;
    expect(headers['correlation-id']?.toString()).toEqual(correlationId);
    expect(headers['parent-event-id']?.toString()).toEqual(correlatedEvent.metadata.parentEventId);
    
    // Verify the event itself also contains the correlation ID
    const receivedEvent = JSON.parse(receivedMessages[0].value.toString()) as BaseEvent;
    expect(receivedEvent.metadata.correlationId).toEqual(correlationId);
  }, 10000);
});