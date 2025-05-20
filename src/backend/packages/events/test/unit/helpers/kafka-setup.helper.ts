import { KafkaService } from '../../../src/kafka/kafka.service';
import { MockEventBroker } from '../../mocks/mock-event-broker';
import { MockErrorHandler } from '../../mocks/mock-error-handler';
import { MockEventProcessor } from '../../mocks/mock-event-processor';
import { MockEventValidator } from '../../mocks/mock-event-validator';
import { KafkaTestClient } from '../../utils/kafka-test-client';
import { waitForEvent, delay } from '../../utils/timing-helpers';
import { compareEvents } from '../../utils/event-comparison';
import { validateEvent } from '../../utils/event-validators';
import * as kafkaFixtures from '../../fixtures/kafka-events';
import * as healthFixtures from '../../fixtures/health-events';
import * as careFixtures from '../../fixtures/care-events';
import * as planFixtures from '../../fixtures/plan-events';
import { EventTypes } from '../../../src/dto/event-types.enum';
import { TOPICS } from '../../../src/constants/topics.constants';
import { ERROR_CODES } from '../../../src/constants/errors.constants';

/**
 * Configuration options for the Kafka test environment
 */
export interface KafkaTestOptions {
  /** Enable/disable automatic error handling */
  autoHandleErrors?: boolean;
  /** Number of retry attempts before failing */
  maxRetries?: number;
  /** Base delay for exponential backoff (ms) */
  retryBaseDelay?: number;
  /** Enable/disable dead letter queue */
  useDLQ?: boolean;
  /** Enable/disable event monitoring */
  enableMonitoring?: boolean;
  /** Simulated network latency (ms) */
  networkLatency?: number;
  /** Probability of message delivery failure (0-1) */
  failureProbability?: number;
  /** Journey services to mock */
  mockJourneys?: ('health' | 'care' | 'plan')[];
}

/**
 * Represents a mock Kafka producer for testing
 */
export interface MockKafkaProducer {
  /** Send a message to a topic */
  send: (topic: string, message: any) => Promise<void>;
  /** Flush all pending messages */
  flush: () => Promise<void>;
  /** Get all messages sent to a topic */
  getSentMessages: (topic: string) => any[];
  /** Close the producer */
  close: () => Promise<void>;
}

/**
 * Represents a mock Kafka consumer for testing
 */
export interface MockKafkaConsumer {
  /** Subscribe to topics */
  subscribe: (topics: string[]) => void;
  /** Start consuming messages */
  run: (options?: { autoCommit?: boolean }) => void;
  /** Pause consumption */
  pause: () => void;
  /** Resume consumption */
  resume: () => void;
  /** Commit offsets */
  commitOffsets: (offsets: any[]) => Promise<void>;
  /** Get all consumed messages */
  getConsumedMessages: () => any[];
  /** Close the consumer */
  close: () => Promise<void>;
}

/**
 * Represents a mock Kafka admin client for testing
 */
export interface MockKafkaAdmin {
  /** Create topics */
  createTopics: (topics: { topic: string }[]) => Promise<void>;
  /** Delete topics */
  deleteTopics: (topics: { topic: string }[]) => Promise<void>;
  /** Get topic metadata */
  getTopicMetadata: (topics: string[]) => Promise<any>;
  /** Close the admin client */
  close: () => Promise<void>;
}

/**
 * Represents a handler for Kafka messages
 */
export type MessageHandler = (message: any) => Promise<void>;

/**
 * Represents a mock Kafka test environment
 */
export interface KafkaTestEnvironment {
  /** Mock Kafka producer */
  producer: MockKafkaProducer;
  /** Mock Kafka consumer */
  consumer: MockKafkaConsumer;
  /** Mock Kafka admin client */
  admin: MockKafkaAdmin;
  /** Mock event broker */
  broker: MockEventBroker;
  /** Mock error handler */
  errorHandler: MockErrorHandler;
  /** Mock event processor */
  eventProcessor: MockEventProcessor;
  /** Mock event validator */
  eventValidator: MockEventValidator;
  /** Clean up resources */
  cleanup: () => Promise<void>;
}

/**
 * Represents monitoring metrics for Kafka events
 */
export interface KafkaEventMetrics {
  /** Total messages produced */
  totalProduced: number;
  /** Total messages consumed */
  totalConsumed: number;
  /** Total messages failed */
  totalFailed: number;
  /** Total messages retried */
  totalRetried: number;
  /** Total messages sent to DLQ */
  totalDLQ: number;
  /** Average processing time (ms) */
  avgProcessingTime: number;
  /** Messages produced per topic */
  producedByTopic: Record<string, number>;
  /** Messages consumed per topic */
  consumedByTopic: Record<string, number>;
  /** Messages failed per error code */
  failedByErrorCode: Record<string, number>;
}

/**
 * Creates a mock Kafka test environment with configurable options
 * 
 * @param options Configuration options for the test environment
 * @returns A configured Kafka test environment
 */
export function createKafkaTestEnvironment(options: KafkaTestOptions = {}): KafkaTestEnvironment {
  // Set default options
  const testOptions: Required<KafkaTestOptions> = {
    autoHandleErrors: options.autoHandleErrors ?? true,
    maxRetries: options.maxRetries ?? 3,
    retryBaseDelay: options.retryBaseDelay ?? 100,
    useDLQ: options.useDLQ ?? true,
    enableMonitoring: options.enableMonitoring ?? true,
    networkLatency: options.networkLatency ?? 10,
    failureProbability: options.failureProbability ?? 0,
    mockJourneys: options.mockJourneys ?? ['health', 'care', 'plan'],
  };

  // Create mock components
  const broker = new MockEventBroker();
  const errorHandler = new MockErrorHandler({
    maxRetries: testOptions.maxRetries,
    retryBaseDelay: testOptions.retryBaseDelay,
    useDLQ: testOptions.useDLQ,
  });
  const eventProcessor = new MockEventProcessor();
  const eventValidator = new MockEventValidator();
  
  // Initialize metrics
  const metrics: KafkaEventMetrics = {
    totalProduced: 0,
    totalConsumed: 0,
    totalFailed: 0,
    totalRetried: 0,
    totalDLQ: 0,
    avgProcessingTime: 0,
    producedByTopic: {},
    consumedByTopic: {},
    failedByErrorCode: {},
  };
  
  // Track processing times for calculating average
  const processingTimes: number[] = [];
  
  // Create mock producer
  const producer: MockKafkaProducer = {
    send: async (topic: string, message: any) => {
      // Simulate network latency
      await delay(testOptions.networkLatency);
      
      // Update metrics
      metrics.totalProduced++;
      metrics.producedByTopic[topic] = (metrics.producedByTopic[topic] || 0) + 1;
      
      // Simulate random failures if configured
      if (Math.random() < testOptions.failureProbability) {
        const error = new Error(`Failed to send message to topic ${topic}`);
        error['code'] = ERROR_CODES.PRODUCER_SEND_ERROR;
        metrics.totalFailed++;
        metrics.failedByErrorCode[ERROR_CODES.PRODUCER_SEND_ERROR] = 
          (metrics.failedByErrorCode[ERROR_CODES.PRODUCER_SEND_ERROR] || 0) + 1;
        
        if (testOptions.autoHandleErrors) {
          await errorHandler.handleProducerError(error, topic, message);
        } else {
          throw error;
        }
      }
      
      // Send message to broker
      await broker.publish(topic, message);
    },
    flush: async () => {
      // No-op in mock implementation
      return Promise.resolve();
    },
    getSentMessages: (topic: string) => {
      return broker.getPublishedMessages(topic);
    },
    close: async () => {
      // No-op in mock implementation
      return Promise.resolve();
    },
  };
  
  // Create mock consumer
  const consumer: MockKafkaConsumer = {
    subscribe: (topics: string[]) => {
      broker.subscribe(topics, async (topic, message) => {
        // Simulate network latency
        await delay(testOptions.networkLatency);
        
        // Update metrics
        metrics.totalConsumed++;
        metrics.consumedByTopic[topic] = (metrics.consumedByTopic[topic] || 0) + 1;
        
        // Process message
        try {
          const startTime = Date.now();
          
          // Validate message
          await eventValidator.validate(message);
          
          // Process message
          await eventProcessor.process(topic, message);
          
          // Calculate processing time
          const processingTime = Date.now() - startTime;
          processingTimes.push(processingTime);
          
          // Update average processing time
          metrics.avgProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
        } catch (error) {
          metrics.totalFailed++;
          metrics.failedByErrorCode[error.code || 'UNKNOWN'] = 
            (metrics.failedByErrorCode[error.code || 'UNKNOWN'] || 0) + 1;
          
          if (testOptions.autoHandleErrors) {
            const retryResult = await errorHandler.handleConsumerError(error, topic, message);
            if (retryResult.retried) {
              metrics.totalRetried++;
            }
            if (retryResult.sentToDLQ) {
              metrics.totalDLQ++;
            }
          } else {
            throw error;
          }
        }
      });
    },
    run: () => {
      broker.startConsuming();
    },
    pause: () => {
      broker.pauseConsuming();
    },
    resume: () => {
      broker.resumeConsuming();
    },
    commitOffsets: async () => {
      // No-op in mock implementation
      return Promise.resolve();
    },
    getConsumedMessages: () => {
      return broker.getConsumedMessages();
    },
    close: async () => {
      broker.stopConsuming();
      return Promise.resolve();
    },
  };
  
  // Create mock admin client
  const admin: MockKafkaAdmin = {
    createTopics: async (topics: { topic: string }[]) => {
      for (const { topic } of topics) {
        broker.createTopic(topic);
      }
      return Promise.resolve();
    },
    deleteTopics: async (topics: { topic: string }[]) => {
      for (const { topic } of topics) {
        broker.deleteTopic(topic);
      }
      return Promise.resolve();
    },
    getTopicMetadata: async (topics: string[]) => {
      return Promise.resolve(topics.map(topic => ({
        name: topic,
        partitions: [{ id: 0, leader: 0, replicas: [0], isr: [0] }],
      })));
    },
    close: async () => {
      return Promise.resolve();
    },
  };
  
  // Return the test environment
  return {
    producer,
    consumer,
    admin,
    broker,
    errorHandler,
    eventProcessor,
    eventValidator,
    cleanup: async () => {
      await producer.close();
      await consumer.close();
      await admin.close();
      broker.reset();
    },
  };
}

/**
 * Creates a mock Kafka producer for testing
 * 
 * @param options Configuration options for the producer
 * @returns A mock Kafka producer
 */
export function createMockProducer(options: KafkaTestOptions = {}): MockKafkaProducer {
  const env = createKafkaTestEnvironment(options);
  return env.producer;
}

/**
 * Creates a mock Kafka consumer for testing
 * 
 * @param options Configuration options for the consumer
 * @returns A mock Kafka consumer
 */
export function createMockConsumer(options: KafkaTestOptions = {}): MockKafkaConsumer {
  const env = createKafkaTestEnvironment(options);
  return env.consumer;
}

/**
 * Creates a mock Kafka admin client for testing
 * 
 * @param options Configuration options for the admin client
 * @returns A mock Kafka admin client
 */
export function createMockAdmin(options: KafkaTestOptions = {}): MockKafkaAdmin {
  const env = createKafkaTestEnvironment(options);
  return env.admin;
}

/**
 * Sets up a test environment with pre-configured topics and message handlers
 * 
 * @param options Configuration options for the test environment
 * @returns A configured Kafka test environment with topics and handlers
 */
export async function setupKafkaTestEnvironment(options: KafkaTestOptions = {}): Promise<KafkaTestEnvironment> {
  const env = createKafkaTestEnvironment(options);
  
  // Create default topics
  await env.admin.createTopics([
    { topic: TOPICS.HEALTH.EVENTS },
    { topic: TOPICS.CARE.EVENTS },
    { topic: TOPICS.PLAN.EVENTS },
    { topic: TOPICS.USER.EVENTS },
    { topic: TOPICS.GAME.EVENTS },
    { topic: TOPICS.DLQ },
  ]);
  
  // Subscribe to all topics
  env.consumer.subscribe([
    TOPICS.HEALTH.EVENTS,
    TOPICS.CARE.EVENTS,
    TOPICS.PLAN.EVENTS,
    TOPICS.USER.EVENTS,
    TOPICS.GAME.EVENTS,
  ]);
  
  // Start consuming
  env.consumer.run();
  
  return env;
}

/**
 * Configures a mock Kafka consumer with custom message handlers for different topics
 * 
 * @param consumer The mock Kafka consumer to configure
 * @param handlers A map of topic names to message handlers
 */
export function configureConsumerHandlers(
  env: KafkaTestEnvironment,
  handlers: Record<string, MessageHandler>
): void {
  // Override the default event processor with custom handlers
  env.eventProcessor.setCustomHandlers(handlers);
}

/**
 * Simulates a Kafka producer error and tests the retry mechanism
 * 
 * @param producer The mock Kafka producer to test
 * @param topic The topic to send the message to
 * @param message The message to send
 * @param errorCode The error code to simulate
 * @returns Information about the retry attempts
 */
export async function testProducerRetryMechanism(
  env: KafkaTestEnvironment,
  topic: string,
  message: any,
  errorCode: string = ERROR_CODES.PRODUCER_SEND_ERROR
): Promise<{ attempts: number, success: boolean, sentToDLQ: boolean }> {
  // Configure error handler to simulate failures
  env.errorHandler.configureError({
    code: errorCode,
    failCount: env.errorHandler.getOptions().maxRetries - 1, // Succeed on last retry
  });
  
  // Track retry attempts
  let attempts = 0;
  env.errorHandler.onRetry(() => {
    attempts++;
  });
  
  // Track DLQ messages
  let sentToDLQ = false;
  env.errorHandler.onSendToDLQ(() => {
    sentToDLQ = true;
  });
  
  // Send message and handle errors
  try {
    await env.producer.send(topic, message);
    return { attempts, success: true, sentToDLQ };
  } catch (error) {
    return { attempts, success: false, sentToDLQ };
  }
}

/**
 * Simulates a Kafka consumer error and tests the retry mechanism
 * 
 * @param env The Kafka test environment
 * @param topic The topic to consume from
 * @param message The message to process
 * @param errorCode The error code to simulate
 * @returns Information about the retry attempts
 */
export async function testConsumerRetryMechanism(
  env: KafkaTestEnvironment,
  topic: string,
  message: any,
  errorCode: string = ERROR_CODES.CONSUMER_PROCESS_ERROR
): Promise<{ attempts: number, success: boolean, sentToDLQ: boolean }> {
  // Configure event processor to simulate failures
  env.eventProcessor.configureError({
    code: errorCode,
    failCount: env.errorHandler.getOptions().maxRetries - 1, // Succeed on last retry
  });
  
  // Track retry attempts
  let attempts = 0;
  env.errorHandler.onRetry(() => {
    attempts++;
  });
  
  // Track DLQ messages
  let sentToDLQ = false;
  env.errorHandler.onSendToDLQ(() => {
    sentToDLQ = true;
  });
  
  // Publish message to broker to trigger consumer
  await env.broker.publish(topic, message);
  
  // Wait for processing to complete
  await waitForEvent(env.eventProcessor, 'processComplete', 1000);
  
  return { 
    attempts, 
    success: env.eventProcessor.getLastProcessResult().success, 
    sentToDLQ 
  };
}

/**
 * Tests the dead letter queue functionality
 * 
 * @param env The Kafka test environment
 * @param topic The topic to consume from
 * @param message The message to process
 * @param errorCode The error code to simulate
 * @returns Information about the DLQ operation
 */
export async function testDeadLetterQueue(
  env: KafkaTestEnvironment,
  topic: string,
  message: any,
  errorCode: string = ERROR_CODES.CONSUMER_PROCESS_ERROR
): Promise<{ sentToDLQ: boolean, dlqMessage: any | null }> {
  // Configure event processor to always fail
  env.eventProcessor.configureError({
    code: errorCode,
    failCount: Infinity, // Always fail
  });
  
  // Configure error handler to use DLQ
  env.errorHandler.configureOptions({
    useDLQ: true,
    maxRetries: 2, // Retry twice then send to DLQ
  });
  
  // Track DLQ messages
  let sentToDLQ = false;
  env.errorHandler.onSendToDLQ(() => {
    sentToDLQ = true;
  });
  
  // Publish message to broker to trigger consumer
  await env.broker.publish(topic, message);
  
  // Wait for processing to complete
  await waitForEvent(env.errorHandler, 'dlqSend', 1000);
  
  // Get DLQ messages
  const dlqMessages = env.broker.getPublishedMessages(TOPICS.DLQ);
  const dlqMessage = dlqMessages.length > 0 ? dlqMessages[0] : null;
  
  return { sentToDLQ, dlqMessage };
}

/**
 * Tests event routing to the appropriate handler based on event type
 * 
 * @param env The Kafka test environment
 * @param events An array of events to route
 * @returns Information about the routing results
 */
export async function testEventRouting(
  env: KafkaTestEnvironment,
  events: Array<{ topic: string, message: any }>
): Promise<{ routedEvents: Record<string, number>, handlerErrors: Error[] }> {
  // Track routing results
  const routedEvents: Record<string, number> = {};
  const handlerErrors: Error[] = [];
  
  // Configure handlers for different event types
  const handlers: Record<string, MessageHandler> = {};
  
  // Create a handler for each event type
  Object.values(EventTypes).forEach(eventType => {
    handlers[eventType] = async (message) => {
      routedEvents[eventType] = (routedEvents[eventType] || 0) + 1;
      
      // Validate that the message has the correct event type
      if (message.type !== eventType) {
        const error = new Error(`Event type mismatch: expected ${eventType}, got ${message.type}`);
        handlerErrors.push(error);
        throw error;
      }
    };
  });
  
  // Configure consumer with handlers
  configureConsumerHandlers(env, handlers);
  
  // Publish events
  for (const { topic, message } of events) {
    await env.broker.publish(topic, message);
  }
  
  // Wait for all events to be processed
  await delay(100 * events.length);
  
  return { routedEvents, handlerErrors };
}

/**
 * Gets monitoring metrics for the Kafka test environment
 * 
 * @param env The Kafka test environment
 * @returns Monitoring metrics
 */
export function getKafkaMetrics(env: KafkaTestEnvironment): KafkaEventMetrics {
  return {
    totalProduced: env.broker.getTotalPublished(),
    totalConsumed: env.broker.getTotalConsumed(),
    totalFailed: env.errorHandler.getTotalErrors(),
    totalRetried: env.errorHandler.getTotalRetries(),
    totalDLQ: env.errorHandler.getTotalDLQ(),
    avgProcessingTime: env.eventProcessor.getAverageProcessingTime(),
    producedByTopic: env.broker.getPublishedByTopic(),
    consumedByTopic: env.broker.getConsumedByTopic(),
    failedByErrorCode: env.errorHandler.getErrorsByCode(),
  };
}

/**
 * Creates a test event with the specified type and payload
 * 
 * @param eventType The type of event to create
 * @param payload The event payload
 * @returns A test event
 */
export function createTestEvent(eventType: EventTypes, payload: any): any {
  // Get the appropriate fixture based on event type
  if (eventType.startsWith('health.')) {
    return healthFixtures.createHealthEvent(eventType, payload);
  } else if (eventType.startsWith('care.')) {
    return careFixtures.createCareEvent(eventType, payload);
  } else if (eventType.startsWith('plan.')) {
    return planFixtures.createPlanEvent(eventType, payload);
  } else {
    // Use base event for other types
    return {
      id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: eventType,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      payload,
    };
  }
}

/**
 * Creates a batch of test events
 * 
 * @param eventType The type of events to create
 * @param count The number of events to create
 * @param payloadFactory A function that generates a payload for each event
 * @returns An array of test events
 */
export function createTestEventBatch(
  eventType: EventTypes,
  count: number,
  payloadFactory: (index: number) => any
): any[] {
  return Array.from({ length: count }, (_, index) => {
    return createTestEvent(eventType, payloadFactory(index));
  });
}

/**
 * Gets the appropriate topic for an event type
 * 
 * @param eventType The event type
 * @returns The corresponding Kafka topic
 */
export function getTopicForEventType(eventType: EventTypes): string {
  if (eventType.startsWith('health.')) {
    return TOPICS.HEALTH.EVENTS;
  } else if (eventType.startsWith('care.')) {
    return TOPICS.CARE.EVENTS;
  } else if (eventType.startsWith('plan.')) {
    return TOPICS.PLAN.EVENTS;
  } else if (eventType.startsWith('user.')) {
    return TOPICS.USER.EVENTS;
  } else if (eventType.startsWith('game.')) {
    return TOPICS.GAME.EVENTS;
  } else {
    throw new Error(`Unknown event type: ${eventType}`);
  }
}