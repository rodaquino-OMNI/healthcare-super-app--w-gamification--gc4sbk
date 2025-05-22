/**
 * Jest setup file for the @austa/events package
 * 
 * This file configures the testing environment for all Jest tests in the events package.
 * It sets up environment variables, global mocks, and ensures proper test isolation.
 */

import { KafkaService } from '../src/kafka/kafka.service';
import { KafkaProducer } from '../src/kafka/kafka.producer';
import { KafkaConsumer } from '../src/kafka/kafka.consumer';
import { EventValidator } from '../src/utils/event-validator';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load test environment variables
dotenv.config({ path: resolve(__dirname, '.env.test') });

// Set default test environment variables if not already set
process.env.KAFKA_BROKERS = process.env.KAFKA_BROKERS || 'localhost:9092';
process.env.KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'events-test-client';
process.env.KAFKA_CONSUMER_GROUP_ID = process.env.KAFKA_CONSUMER_GROUP_ID || 'events-test-consumer-group';
process.env.KAFKA_CONNECTION_TIMEOUT = process.env.KAFKA_CONNECTION_TIMEOUT || '3000';
process.env.KAFKA_REQUEST_TIMEOUT = process.env.KAFKA_REQUEST_TIMEOUT || '5000';
process.env.KAFKA_RETRY_MAX_RETRIES = process.env.KAFKA_RETRY_MAX_RETRIES || '3';
process.env.KAFKA_RETRY_INITIAL_BACKOFF = process.env.KAFKA_RETRY_INITIAL_BACKOFF || '300';
process.env.KAFKA_RETRY_MAX_BACKOFF = process.env.KAFKA_RETRY_MAX_BACKOFF || '1000';

// Create global mocks
jest.mock('../src/kafka/kafka.service');
jest.mock('../src/kafka/kafka.producer');
jest.mock('../src/kafka/kafka.consumer');
jest.mock('../src/utils/event-validator');

// Mock implementation for KafkaService
const mockKafkaService = KafkaService as jest.MockedClass<typeof KafkaService>;
mockKafkaService.prototype.connect = jest.fn().mockResolvedValue(undefined);
mockKafkaService.prototype.disconnect = jest.fn().mockResolvedValue(undefined);
mockKafkaService.prototype.getProducer = jest.fn().mockReturnValue({
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  send: jest.fn().mockResolvedValue({ topicName: 'test-topic', partition: 0, errorCode: 0 }),
});

// Mock implementation for KafkaProducer
const mockKafkaProducer = KafkaProducer as jest.MockedClass<typeof KafkaProducer>;
mockKafkaProducer.prototype.connect = jest.fn().mockResolvedValue(undefined);
mockKafkaProducer.prototype.disconnect = jest.fn().mockResolvedValue(undefined);
mockKafkaProducer.prototype.send = jest.fn().mockResolvedValue({ topicName: 'test-topic', partition: 0, errorCode: 0 });

// Mock implementation for KafkaConsumer
const mockKafkaConsumer = KafkaConsumer as jest.MockedClass<typeof KafkaConsumer>;
mockKafkaConsumer.prototype.connect = jest.fn().mockResolvedValue(undefined);
mockKafkaConsumer.prototype.disconnect = jest.fn().mockResolvedValue(undefined);
mockKafkaConsumer.prototype.subscribe = jest.fn().mockResolvedValue(undefined);
mockKafkaConsumer.prototype.consume = jest.fn().mockResolvedValue(undefined);

// Mock implementation for EventValidator
const mockEventValidator = EventValidator as jest.MockedClass<typeof EventValidator>;
mockEventValidator.prototype.validate = jest.fn().mockReturnValue({ valid: true, errors: [] });

// Configure Jest hooks
beforeAll(() => {
  // Set up any global test configuration
  console.log('Setting up event tests environment...');
});

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

afterAll(async () => {
  // Clean up any resources after all tests
  console.log('Cleaning up event tests environment...');
});

// Configure Jest globals
global.EventTestHelpers = {
  /**
   * Creates a mock Kafka message for testing
   * 
   * @param topic - The Kafka topic
   * @param payload - The message payload
   * @param headers - Optional message headers
   * @returns A mock Kafka message object
   */
  createMockKafkaMessage: (topic: string, payload: any, headers: Record<string, string> = {}) => {
    const value = JSON.stringify(payload);
    return {
      topic,
      partition: 0,
      offset: '0',
      timestamp: Date.now().toString(),
      size: value.length,
      attributes: 0,
      key: null,
      value: Buffer.from(value),
      headers: Object.entries(headers).map(([key, value]) => ({
        key,
        value: Buffer.from(value),
      })),
    };
  },

  /**
   * Creates a mock event with the specified type and payload
   * 
   * @param eventType - The type of event to create
   * @param payload - The event payload
   * @param journeyContext - Optional journey context
   * @returns A mock event object
   */
  createMockEvent: (eventType: string, payload: any, journeyContext?: string) => {
    return {
      id: `test-event-${Date.now()}`,
      type: eventType,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      payload,
      journeyContext: journeyContext || 'health',
      source: 'test',
      correlationId: `test-correlation-${Date.now()}`,
    };
  },

  /**
   * Waits for a specified amount of time
   * 
   * @param ms - The number of milliseconds to wait
   * @returns A promise that resolves after the specified time
   */
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};

// Add custom matchers
expect.extend({
  /**
   * Custom matcher to check if an event is valid according to its schema
   */
  toBeValidEvent(received: any) {
    const validator = new EventValidator();
    const result = validator.validate(received);
    
    if (result.valid) {
      return {
        message: () => 'Expected event to not be valid',
        pass: true,
      };
    } else {
      return {
        message: () => `Expected event to be valid, but found errors: ${JSON.stringify(result.errors)}`,
        pass: false,
      };
    }
  },

  /**
   * Custom matcher to check if an event has the expected journey context
   */
  toHaveJourneyContext(received: any, journeyContext: string) {
    const pass = received.journeyContext === journeyContext;
    
    if (pass) {
      return {
        message: () => `Expected event not to have journey context ${journeyContext}`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected event to have journey context ${journeyContext}, but found ${received.journeyContext}`,
        pass: false,
      };
    }
  },
});

// Extend TypeScript declarations
declare global {
  // eslint-disable-next-line no-var
  var EventTestHelpers: {
    createMockKafkaMessage: (topic: string, payload: any, headers?: Record<string, string>) => any;
    createMockEvent: (eventType: string, payload: any, journeyContext?: string) => any;
    wait: (ms: number) => Promise<void>;
  };
  
  namespace jest {
    interface Matchers<R> {
      toBeValidEvent(): R;
      toHaveJourneyContext(journeyContext: string): R;
    }
  }
}