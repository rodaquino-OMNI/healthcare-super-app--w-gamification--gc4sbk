/**
 * Jest setup file for the events package
 * 
 * This file configures the testing environment for all event-related tests:
 * - Sets up environment variables for test Kafka connections
 * - Configures global mocks for Kafka clients and producers
 * - Sets up event validation for testing
 * - Ensures proper cleanup between tests
 */

import { jest } from '@jest/globals';

// Mock KafkaJS
jest.mock('kafkajs', () => {
  // Create mock implementations with Jest spy functions
  const mockConnect = jest.fn().mockResolvedValue(undefined);
  const mockDisconnect = jest.fn().mockResolvedValue(undefined);
  const mockSend = jest.fn().mockResolvedValue({
    topicName: 'test-topic',
    partition: 0,
    errorCode: 0,
  });
  const mockSubscribe = jest.fn().mockResolvedValue(undefined);
  const mockRun = jest.fn().mockResolvedValue(undefined);
  const mockStop = jest.fn().mockResolvedValue(undefined);
  const mockPause = jest.fn().mockResolvedValue(undefined);
  const mockResume = jest.fn().mockResolvedValue(undefined);
  const mockSeek = jest.fn().mockResolvedValue(undefined);
  const mockCommitOffsets = jest.fn().mockResolvedValue(undefined);
  const mockCreateTopics = jest.fn().mockResolvedValue(undefined);
  const mockDeleteTopics = jest.fn().mockResolvedValue(undefined);
  const mockFetchTopicMetadata = jest.fn().mockResolvedValue({
    topics: [{ name: 'test-topic', partitions: [{ partitionId: 0 }] }],
  });

  // Mock Producer class
  const MockProducer = jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    send: mockSend,
    transaction: jest.fn().mockImplementation(() => ({
      send: mockSend,
      commit: jest.fn().mockResolvedValue(undefined),
      abort: jest.fn().mockResolvedValue(undefined),
    })),
    logger: jest.fn(),
    events: {
      CONNECT: 'producer.connect',
      DISCONNECT: 'producer.disconnect',
      REQUEST: 'producer.request',
      REQUEST_TIMEOUT: 'producer.request_timeout',
      REQUEST_QUEUE_SIZE: 'producer.request_queue_size',
    },
  }));

  // Mock Consumer class
  const MockConsumer = jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    subscribe: mockSubscribe,
    run: mockRun,
    stop: mockStop,
    pause: mockPause,
    resume: mockResume,
    seek: mockSeek,
    commitOffsets: mockCommitOffsets,
    logger: jest.fn(),
    events: {
      CONNECT: 'consumer.connect',
      DISCONNECT: 'consumer.disconnect',
      REQUEST: 'consumer.request',
      REQUEST_TIMEOUT: 'consumer.request_timeout',
      REQUEST_QUEUE_SIZE: 'consumer.request_queue_size',
      CRASH: 'consumer.crash',
    },
  }));

  // Mock Admin class
  const MockAdmin = jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    createTopics: mockCreateTopics,
    deleteTopics: mockDeleteTopics,
    fetchTopicMetadata: mockFetchTopicMetadata,
    logger: jest.fn(),
    events: {
      CONNECT: 'admin.connect',
      DISCONNECT: 'admin.disconnect',
      REQUEST: 'admin.request',
      REQUEST_TIMEOUT: 'admin.request_timeout',
      REQUEST_QUEUE_SIZE: 'admin.request_queue_size',
    },
  }));

  // Mock Kafka class
  const MockKafka = jest.fn().mockImplementation(() => ({
    producer: jest.fn().mockReturnValue(new MockProducer()),
    consumer: jest.fn().mockReturnValue(new MockConsumer()),
    admin: jest.fn().mockReturnValue(new MockAdmin()),
    logger: jest.fn(),
  }));

  // Return the mock implementation
  return {
    Kafka: MockKafka,
    logLevel: {
      NOTHING: 0,
      ERROR: 1,
      WARN: 2,
      INFO: 4,
      DEBUG: 5,
    },
    CompressionTypes: {
      None: 0,
      GZIP: 1,
      Snappy: 2,
      LZ4: 3,
      ZSTD: 4,
    },
    // Expose mock functions for test assertions and manipulations
    mockProducer: {
      connect: mockConnect,
      disconnect: mockDisconnect,
      send: mockSend,
    },
    mockConsumer: {
      connect: mockConnect,
      disconnect: mockDisconnect,
      subscribe: mockSubscribe,
      run: mockRun,
      stop: mockStop,
      pause: mockPause,
      resume: mockResume,
      seek: mockSeek,
      commitOffsets: mockCommitOffsets,
    },
    mockAdmin: {
      connect: mockConnect,
      disconnect: mockDisconnect,
      createTopics: mockCreateTopics,
      deleteTopics: mockDeleteTopics,
      fetchTopicMetadata: mockFetchTopicMetadata,
    },
  };
});

// Mock event validation
jest.mock('../src/utils/event-validator', () => ({
  validateEvent: jest.fn().mockReturnValue({ valid: true, errors: [] }),
  validateEventSchema: jest.fn().mockReturnValue({ valid: true, errors: [] }),
  getEventSchema: jest.fn().mockReturnValue({}),
}));

// Configure environment variables for testing
process.env.KAFKA_BROKERS = 'localhost:9092';
process.env.KAFKA_CLIENT_ID = 'test-client';
process.env.KAFKA_GROUP_ID = 'test-group';
process.env.KAFKA_CONNECTION_TIMEOUT = '3000';
process.env.KAFKA_RETRY_MAX_RETRIES = '3';
process.env.KAFKA_RETRY_INITIAL_RETRY_TIME = '100';
process.env.KAFKA_RETRY_FACTOR = '1.5';

// Configure event topics for testing
process.env.KAFKA_HEALTH_TOPIC = 'health.events.test';
process.env.KAFKA_CARE_TOPIC = 'care.events.test';
process.env.KAFKA_PLAN_TOPIC = 'plan.events.test';
process.env.KAFKA_USER_TOPIC = 'user.events.test';
process.env.KAFKA_GAME_TOPIC = 'game.events.test';
process.env.KAFKA_DLQ_TOPIC = 'dlq.events.test';

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset Kafka mock implementations to default behavior
  const kafkajs = require('kafkajs');
  
  // Reset producer mocks
  kafkajs.mockProducer.connect.mockResolvedValue(undefined);
  kafkajs.mockProducer.disconnect.mockResolvedValue(undefined);
  kafkajs.mockProducer.send.mockResolvedValue({
    topicName: 'test-topic',
    partition: 0,
    errorCode: 0,
  });
  
  // Reset consumer mocks
  kafkajs.mockConsumer.connect.mockResolvedValue(undefined);
  kafkajs.mockConsumer.disconnect.mockResolvedValue(undefined);
  kafkajs.mockConsumer.subscribe.mockResolvedValue(undefined);
  kafkajs.mockConsumer.run.mockResolvedValue(undefined);
  kafkajs.mockConsumer.stop.mockResolvedValue(undefined);
  
  // Reset admin mocks
  kafkajs.mockAdmin.connect.mockResolvedValue(undefined);
  kafkajs.mockAdmin.disconnect.mockResolvedValue(undefined);
  kafkajs.mockAdmin.createTopics.mockResolvedValue(undefined);
  kafkajs.mockAdmin.deleteTopics.mockResolvedValue(undefined);
  kafkajs.mockAdmin.fetchTopicMetadata.mockResolvedValue({
    topics: [{ name: 'test-topic', partitions: [{ partitionId: 0 }] }],
  });
  
  // Reset event validation mocks
  const eventValidator = require('../src/utils/event-validator');
  eventValidator.validateEvent.mockReturnValue({ valid: true, errors: [] });
  eventValidator.validateEventSchema.mockReturnValue({ valid: true, errors: [] });
  eventValidator.getEventSchema.mockReturnValue({});
});

// Global teardown after all tests
afterAll(() => {
  // Clean up any resources that might persist between test runs
  jest.restoreAllMocks();
});

// Helper function to simulate Kafka message consumption
global.simulateKafkaMessage = (topic: string, message: any) => {
  const kafkajs = require('kafkajs');
  const mockEachMessageFn = kafkajs.mockConsumer.run.mock.calls[0]?.[0]?.eachMessage;
  
  if (mockEachMessageFn) {
    return mockEachMessageFn({
      topic,
      partition: 0,
      message: {
        key: Buffer.from('test-key'),
        value: Buffer.from(JSON.stringify(message)),
        timestamp: Date.now().toString(),
        offset: '0',
        headers: {},
      },
    });
  }
  
  throw new Error('No consumer is running. Make sure to call consumer.run() before simulating messages.');
};

// Helper function to create test events
global.createTestEvent = (type: string, payload: any, userId: string = 'test-user-id') => {
  return {
    eventId: `test-${Date.now()}`,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source: 'test',
    type,
    userId,
    payload,
    metadata: {
      correlationId: `test-correlation-${Date.now()}`,
      journeyContext: type.split('.')[0] || 'test',
    },
  };
};

// Add global type definitions
declare global {
  // eslint-disable-next-line no-var
  var simulateKafkaMessage: (topic: string, message: any) => Promise<void>;
  // eslint-disable-next-line no-var
  var createTestEvent: (type: string, payload: any, userId?: string) => any;
}