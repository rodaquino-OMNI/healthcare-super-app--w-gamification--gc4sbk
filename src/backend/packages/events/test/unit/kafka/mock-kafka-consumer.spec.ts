/**
 * Unit tests for the MockKafkaConsumer class
 */

import { MockKafkaConsumer, MockKafkaMessage } from './mocks/mock-kafka-consumer';

describe('MockKafkaConsumer', () => {
  let consumer: MockKafkaConsumer;
  const groupId = 'test-group';
  const testTopic = 'test-topic';

  beforeEach(() => {
    // Create a new consumer instance before each test
    consumer = new MockKafkaConsumer({ groupId });
  });

  afterEach(() => {
    // Reset the consumer after each test
    consumer.reset();
  });

  describe('Basic functionality', () => {
    it('should connect successfully', async () => {
      await consumer.connect();
      // No error means success
    });

    it('should subscribe to topics', async () => {
      await consumer.connect();
      await consumer.subscribe({ topic: testTopic });
      // No error means success
    });

    it('should run with message handler', async () => {
      await consumer.connect();
      await consumer.subscribe({ topic: testTopic });
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          // Handler will be called when processing messages
        },
      });
      // No error means success
    });

    it('should disconnect successfully', async () => {
      await consumer.connect();
      await consumer.disconnect();
      // No error means success
    });
  });

  describe('Message processing', () => {
    it('should process messages added to the queue', async () => {
      // Setup consumer
      await consumer.connect();
      await consumer.subscribe({ topic: testTopic });
      
      // Setup message handler with spy
      const messageSpy = jest.fn();
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          messageSpy(topic, message.value?.toString());
        },
      });

      // Add a test message
      const testMessage: MockKafkaMessage = {
        key: 'test-key',
        value: 'test-value',
        offset: '0',
      };
      consumer.addMessage(testTopic, testMessage);

      // Process the message
      await consumer.processNextMessage(testTopic);

      // Verify the message handler was called with correct arguments
      expect(messageSpy).toHaveBeenCalledWith(testTopic, 'test-value');
    });

    it('should process multiple messages in order', async () => {
      // Setup consumer
      await consumer.connect();
      await consumer.subscribe({ topic: testTopic });
      
      // Setup message handler with spy
      const messages: string[] = [];
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          messages.push(message.value?.toString() || '');
        },
      });

      // Add test messages
      const testMessages: MockKafkaMessage[] = [
        { key: 'key-1', value: 'value-1', offset: '0' },
        { key: 'key-2', value: 'value-2', offset: '1' },
        { key: 'key-3', value: 'value-3', offset: '2' },
      ];
      consumer.addMessages(testTopic, testMessages);

      // Process all messages
      const processedCount = await consumer.processAllMessages(testTopic);

      // Verify all messages were processed in order
      expect(processedCount).toBe(3);
      expect(messages).toEqual(['value-1', 'value-2', 'value-3']);
    });
  });

  describe('Error handling and retries', () => {
    it('should retry failed messages with exponential backoff', async () => {
      // Setup consumer
      await consumer.connect();
      await consumer.subscribe({ topic: testTopic });
      
      // Setup message handler that fails on first attempt
      let attempts = 0;
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          attempts++;
          if (attempts === 1) {
            throw new Error('Simulated processing error');
          }
        },
      });

      // Add a test message
      const testMessage: MockKafkaMessage = {
        key: 'retry-key',
        value: 'retry-value',
        offset: '0',
      };
      consumer.addMessage(testTopic, testMessage);

      // Process the message - should fail first time
      await expect(consumer.processNextMessage(testTopic)).rejects.toThrow('Simulated processing error');

      // Verify retry count was incremented
      const retryCount = consumer.getRetryCount();
      expect(retryCount.get(`${testTopic}-0`)).toBe(1);

      // Message should be back in the queue for retry
      const messageQueue = consumer.getMessageQueue();
      expect(messageQueue.get(testTopic)?.length).toBe(1);
    });

    it('should move messages to dead letter queue after max retries', async () => {
      // Setup consumer with lower max retries for testing
      consumer = new MockKafkaConsumer({ 
        groupId,
        retry: { retries: 2 }
      });
      
      await consumer.connect();
      await consumer.subscribe({ topic: testTopic });
      
      // Setup message handler that always fails
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          throw new Error('Persistent error');
        },
      });

      // Add a test message
      const testMessage: MockKafkaMessage = {
        key: 'dlq-key',
        value: 'dlq-value',
        offset: '0',
      };
      consumer.addMessage(testTopic, testMessage);

      // Process the message - should fail
      await expect(consumer.processNextMessage(testTopic)).rejects.toThrow('Persistent error');
      
      // Manually trigger retries (in real scenario this would happen via setTimeout)
      consumer.addMessage(testTopic, testMessage);
      await expect(consumer.processNextMessage(testTopic)).rejects.toThrow('Persistent error');
      
      consumer.addMessage(testTopic, testMessage);
      await expect(consumer.processNextMessage(testTopic)).rejects.toThrow('Persistent error');

      // Set retry count to max to simulate all retries exhausted
      const messageId = `${testTopic}-0`;
      consumer.getRetryCount().set(messageId, 2);
      
      // Add message again and process - should go to DLQ after this attempt
      consumer.addMessage(testTopic, testMessage);
      await expect(consumer.processNextMessage(testTopic)).rejects.toThrow('Persistent error');

      // Verify message is in dead letter queue
      const dlq = consumer.getDeadLetterQueue();
      expect(dlq.get(testTopic)?.length).toBe(1);
      expect(dlq.get(testTopic)?.[0].value).toBe('dlq-value');
    });
  });

  describe('Pause and resume', () => {
    it('should not process messages for paused topics', async () => {
      // Setup consumer
      await consumer.connect();
      await consumer.subscribe({ topic: testTopic });
      
      // Setup message handler with spy
      const messageSpy = jest.fn();
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          messageSpy(topic, message.value?.toString());
        },
      });

      // Add a test message
      consumer.addMessage(testTopic, { value: 'test-value' });

      // Pause the topic
      consumer.pause([testTopic]);

      // Try to process the message
      const processed = await consumer.processNextMessage(testTopic);

      // Verify the message was not processed
      expect(processed).toBe(false);
      expect(messageSpy).not.toHaveBeenCalled();

      // Resume the topic
      consumer.resume([testTopic]);

      // Now process the message
      await consumer.processNextMessage(testTopic);

      // Verify the message was processed after resuming
      expect(messageSpy).toHaveBeenCalledWith(testTopic, 'test-value');
    });
  });

  describe('Offset management', () => {
    it('should track committed offsets', async () => {
      // Setup consumer
      await consumer.connect();
      await consumer.subscribe({ topic: testTopic });
      await consumer.run({ eachMessage: async () => {} });

      // Commit some offsets
      await consumer.commitOffsets({
        topics: [{
          topic: testTopic,
          partitions: [{
            partition: 0,
            offset: '5',
          }],
        }],
      });

      // Verify offsets were committed
      const committedOffsets = consumer.getCommittedOffsets();
      expect(committedOffsets.get(testTopic)?.get(0)).toBe('5');
    });

    it('should auto-commit offsets when processing messages', async () => {
      // Setup consumer with auto-commit enabled
      await consumer.connect();
      await consumer.subscribe({ topic: testTopic });
      await consumer.run({
        eachMessage: async () => {},
        autoCommit: true,
      });

      // Add and process a message
      consumer.addMessage(testTopic, { value: 'auto-commit-test', offset: '10' });
      await consumer.processNextMessage(testTopic);

      // Verify offset was auto-committed
      const committedOffsets = consumer.getCommittedOffsets();
      expect(committedOffsets.get(testTopic)?.get(0)).toBe('10');
    });
  });

  describe('Error simulation', () => {
    it('should simulate connection errors', async () => {
      // Configure consumer to simulate an error
      const testError = new Error('Simulated connection error');
      consumer.simulateError(testError);

      // Attempt to connect should throw the simulated error
      await expect(consumer.connect()).rejects.toThrow('Simulated connection error');
    });

    it('should stop simulating errors when requested', async () => {
      // Configure consumer to simulate an error
      consumer.simulateError(new Error('Temporary error'));

      // Stop simulating errors
      consumer.stopSimulatingError();

      // Connect should now succeed
      await consumer.connect();
      // No error means success
    });
  });
});