/**
 * Jest setup file for the @austa/events package
 * 
 * This file configures the testing environment for all Jest tests in the events package.
 * It sets up:
 * - Environment variables for testing
 * - Global mocks for Kafka clients and producers
 * - Test event validation configuration
 * - Cleanup between tests
 * 
 * @file This file is automatically loaded by Jest before running tests
 * @see jest.config.js - setupFilesAfterEnv configuration
 */

import { KafkaService } from '../src/kafka/kafka.service';
import { KafkaProducer } from '../src/kafka/kafka.producer';
import { KafkaConsumer } from '../src/kafka/kafka.consumer';
import * as eventValidator from '../src/utils/event-validator';
import * as correlationId from '../src/utils/correlation-id';
import { EventTypes } from '../src/dto/event-types.enum';

// Configure environment variables for testing
process.env.KAFKA_BROKERS = process.env.KAFKA_BROKERS || 'localhost:9092';
process.env.KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'events-test-client';
process.env.KAFKA_CONSUMER_GROUP_ID = process.env.KAFKA_CONSUMER_GROUP_ID || 'events-test-consumer-group';
process.env.KAFKA_CONNECTION_TIMEOUT = process.env.KAFKA_CONNECTION_TIMEOUT || '3000';
process.env.KAFKA_RETRY_MAX_ATTEMPTS = process.env.KAFKA_RETRY_MAX_ATTEMPTS || '3';
process.env.KAFKA_RETRY_INITIAL_DELAY = process.env.KAFKA_RETRY_INITIAL_DELAY || '100';
process.env.KAFKA_DLQ_TOPIC_PREFIX = process.env.KAFKA_DLQ_TOPIC_PREFIX || 'dlq-';
process.env.NODE_ENV = 'test';

// Create mock implementations
const mockSend = jest.fn().mockResolvedValue({ success: true });
const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockDisconnect = jest.fn().mockResolvedValue(undefined);
const mockSubscribe = jest.fn().mockResolvedValue(undefined);
const mockUnsubscribe = jest.fn().mockResolvedValue(undefined);
const mockValidateEvent = jest.fn().mockReturnValue({ valid: true, errors: [] });
const mockGenerateCorrelationId = jest.fn().mockReturnValue('test-correlation-id');

// Mock KafkaService
jest.mock('../src/kafka/kafka.service', () => {
  return {
    KafkaService: jest.fn().mockImplementation(() => {
      return {
        connect: mockConnect,
        disconnect: mockDisconnect,
        getClient: jest.fn().mockReturnValue({
          producer: jest.fn().mockReturnValue({
            connect: jest.fn().mockResolvedValue(undefined),
            send: jest.fn().mockResolvedValue({ success: true }),
            disconnect: jest.fn().mockResolvedValue(undefined),
          }),
          consumer: jest.fn().mockReturnValue({
            connect: jest.fn().mockResolvedValue(undefined),
            subscribe: jest.fn().mockResolvedValue(undefined),
            run: jest.fn().mockResolvedValue(undefined),
            disconnect: jest.fn().mockResolvedValue(undefined),
          }),
          admin: jest.fn().mockReturnValue({
            connect: jest.fn().mockResolvedValue(undefined),
            createTopics: jest.fn().mockResolvedValue(undefined),
            disconnect: jest.fn().mockResolvedValue(undefined),
          }),
        }),
        isConnected: jest.fn().mockReturnValue(true),
        onModuleInit: jest.fn().mockResolvedValue(undefined),
        onModuleDestroy: jest.fn().mockResolvedValue(undefined),
        onApplicationShutdown: jest.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

// Mock KafkaProducer
jest.mock('../src/kafka/kafka.producer', () => {
  return {
    KafkaProducer: jest.fn().mockImplementation(() => {
      return {
        send: mockSend,
        sendBatch: jest.fn().mockResolvedValue({ success: true }),
        onModuleInit: jest.fn().mockResolvedValue(undefined),
        onModuleDestroy: jest.fn().mockResolvedValue(undefined),
        onApplicationShutdown: jest.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

// Mock KafkaConsumer
jest.mock('../src/kafka/kafka.consumer', () => {
  return {
    KafkaConsumer: jest.fn().mockImplementation(() => {
      return {
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        onMessage: jest.fn(),
        onBatchMessage: jest.fn(),
        onError: jest.fn(),
        onModuleInit: jest.fn().mockResolvedValue(undefined),
        onModuleDestroy: jest.fn().mockResolvedValue(undefined),
        onApplicationShutdown: jest.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

// Mock event validator
jest.mock('../src/utils/event-validator', () => {
  return {
    validateEvent: mockValidateEvent,
    validateEventType: jest.fn().mockReturnValue(true),
    validateEventPayload: jest.fn().mockReturnValue({ valid: true, errors: [] }),
    getSchemaForEventType: jest.fn().mockReturnValue({}),
  };
});

// Mock correlation ID utilities
jest.mock('../src/utils/correlation-id', () => {
  return {
    generateCorrelationId: mockGenerateCorrelationId,
    extractCorrelationId: jest.fn().mockReturnValue('test-correlation-id'),
    withCorrelationId: jest.fn().mockImplementation((event) => ({
      ...event,
      metadata: { ...event.metadata, correlationId: 'test-correlation-id' },
    })),
  };
});

// Mock event serializer
jest.mock('../src/utils/event-serializer', () => {
  return {
    serializeEvent: jest.fn().mockImplementation((event) => JSON.stringify(event)),
    deserializeEvent: jest.fn().mockImplementation((data) => {
      try {
        return JSON.parse(data);
      } catch (e) {
        return data;
      }
    }),
  };
});

// Create global test utilities
global.eventTestUtils = {
  mockKafkaService: {
    connect: mockConnect,
    disconnect: mockDisconnect,
  },
  mockKafkaProducer: {
    send: mockSend,
  },
  mockKafkaConsumer: {
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
  },
  mockEventValidator: {
    validateEvent: mockValidateEvent,
  },
  mockCorrelationId: {
    generateCorrelationId: mockGenerateCorrelationId,
  },
  eventTypes: EventTypes,
  createTestEvent: (type, payload = {}, userId = 'test-user-id') => ({
    eventId: 'test-event-id',
    eventType: type,
    timestamp: new Date().toISOString(),
    userId,
    version: '1.0.0',
    payload,
    metadata: {
      correlationId: 'test-correlation-id',
      source: 'test',
    },
  }),
  createJourneyEvent: (journey, type, payload = {}, userId = 'test-user-id') => ({
    eventId: 'test-event-id',
    eventType: type,
    timestamp: new Date().toISOString(),
    userId,
    version: '1.0.0',
    journey,
    payload,
    metadata: {
      correlationId: 'test-correlation-id',
      source: 'test',
      journey,
    },
  }),
  mockEventResponse: (success = true, data = {}, error = null) => ({
    success,
    data,
    error,
    timestamp: new Date().toISOString(),
    correlationId: 'test-correlation-id',
  }),
};

// Add global type definitions
declare global {
  // eslint-disable-next-line no-var
  var eventTestUtils: {
    mockKafkaService: {
      connect: jest.Mock;
      disconnect: jest.Mock;
    };
    mockKafkaProducer: {
      send: jest.Mock;
    };
    mockKafkaConsumer: {
      subscribe: jest.Mock;
      unsubscribe: jest.Mock;
    };
    mockEventValidator: {
      validateEvent: jest.Mock;
    };
    mockCorrelationId: {
      generateCorrelationId: jest.Mock;
    };
    eventTypes: typeof EventTypes;
    createTestEvent: (type: string, payload?: Record<string, any>, userId?: string) => any;
    createJourneyEvent: (journey: 'health' | 'care' | 'plan', type: string, payload?: Record<string, any>, userId?: string) => any;
    mockEventResponse: (success?: boolean, data?: Record<string, any>, error?: any) => {
      success: boolean;
      data: Record<string, any>;
      error: any;
      timestamp: string;
      correlationId: string;
    };
  };
}

// Reset all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset mock implementations to default values
  mockSend.mockResolvedValue({ success: true });
  mockConnect.mockResolvedValue(undefined);
  mockDisconnect.mockResolvedValue(undefined);
  mockSubscribe.mockResolvedValue(undefined);
  mockUnsubscribe.mockResolvedValue(undefined);
  mockValidateEvent.mockReturnValue({ valid: true, errors: [] });
  mockGenerateCorrelationId.mockReturnValue('test-correlation-id');
});

// Clean up after all tests
afterAll(() => {
  jest.restoreAllMocks();
});

// Log test environment setup
console.log('🔧 Events package test environment configured');
console.log(`🔌 Using Kafka brokers: ${process.env.KAFKA_BROKERS}`);
console.log(`🔑 Using Kafka client ID: ${process.env.KAFKA_CLIENT_ID}`);
console.log(`👥 Using Kafka consumer group: ${process.env.KAFKA_CONSUMER_GROUP_ID}`);