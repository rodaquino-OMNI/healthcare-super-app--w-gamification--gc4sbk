import { Injectable } from '@nestjs/common';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { KafkaService } from './kafka.service';

/**
 * Service for producing messages to Kafka topics with enhanced reliability
 * 
 * Provides methods for sending messages to Kafka topics with distributed tracing,
 * comprehensive error handling, and retry capabilities.
 */
@Injectable()
export class KafkaProducerService {
  /**
   * Creates an instance of KafkaProducerService
   * 
   * @param kafkaService Core Kafka service for broker communication
   * @param logger Logger service for structured logging
   * @param tracingService Tracing service for distributed tracing
   */
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
  ) {
    this.logger.log('KafkaProducerService initialized', 'KafkaProducerService');
  }

  /**
   * Sends a message to a Kafka topic with tracing and error handling
   * 
   * @param topic Topic to send the message to
   * @param message Message payload
   * @param key Optional message key for partitioning
   * @param headers Optional message headers
   * @returns Promise that resolves when the message is sent
   */
  async send(
    topic: string,
    message: any,
    key?: string,
    headers?: Record<string, string>,
  ): Promise<void> {
    const span = this.tracingService.startSpan('kafka.producer.send');
    span.setTag('kafka.topic', topic);
    
    try {
      // Add tracing context to headers
      const tracingHeaders = this.tracingService.getTraceHeaders(span);
      const allHeaders = { ...headers, ...tracingHeaders };
      
      // Add timestamp if not present
      if (typeof message === 'object' && message !== null && !message.timestamp) {
        message.timestamp = new Date().toISOString();
      }
      
      this.logger.log(`Sending message to topic: ${topic}`, 'KafkaProducerService');
      await this.kafkaService.produce(topic, message, key, allHeaders);
      
      span.finish();
    } catch (error) {
      span.setTag('error', true);
      span.log({ event: 'error', 'error.object': error, message: error.message });
      span.finish();
      
      this.logger.error(
        `Failed to send message to topic ${topic}: ${error.message}`,
        error.stack,
        'KafkaProducerService',
      );
      throw error;
    }
  }

  /**
   * Sends a batch of messages to a Kafka topic
   * 
   * @param topic Topic to send the messages to
   * @param messages Array of message payloads
   * @param keys Optional array of message keys
   * @param headers Optional message headers to apply to all messages
   * @returns Promise that resolves when all messages are sent
   */
  async sendBatch(
    topic: string,
    messages: any[],
    keys?: string[],
    headers?: Record<string, string>,
  ): Promise<void> {
    const span = this.tracingService.startSpan('kafka.producer.sendBatch');
    span.setTag('kafka.topic', topic);
    span.setTag('kafka.batch.size', messages.length);
    
    try {
      // Add tracing context to headers
      const tracingHeaders = this.tracingService.getTraceHeaders(span);
      const allHeaders = { ...headers, ...tracingHeaders };
      
      this.logger.log(`Sending batch of ${messages.length} messages to topic: ${topic}`, 'KafkaProducerService');
      
      // Process messages in parallel with a concurrency limit
      const batchSize = 10;
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        const batchKeys = keys ? keys.slice(i, i + batchSize) : undefined;
        
        await Promise.all(
          batch.map((message, index) => {
            // Add timestamp if not present
            if (typeof message === 'object' && message !== null && !message.timestamp) {
              message.timestamp = new Date().toISOString();
            }
            
            const key = batchKeys ? batchKeys[index] : undefined;
            return this.kafkaService.produce(topic, message, key, allHeaders);
          }),
        );
      }
      
      this.logger.log(`Successfully sent batch of ${messages.length} messages to topic: ${topic}`, 'KafkaProducerService');
      span.finish();
    } catch (error) {
      span.setTag('error', true);
      span.log({ event: 'error', 'error.object': error, message: error.message });
      span.finish();
      
      this.logger.error(
        `Failed to send batch to topic ${topic}: ${error.message}`,
        error.stack,
        'KafkaProducerService',
      );
      throw error;
    }
  }

  /**
   * Sends a message to a Kafka topic with guaranteed delivery
   * 
   * Retries sending the message with exponential backoff until successful
   * or the maximum number of retries is reached.
   * 
   * @param topic Topic to send the message to
   * @param message Message payload
   * @param key Optional message key for partitioning
   * @param headers Optional message headers
   * @param maxRetries Maximum number of retry attempts (default: 3)
   * @param initialDelay Initial delay between retries in ms (default: 1000)
   * @returns Promise that resolves when the message is sent
   */
  async sendWithRetry(
    topic: string,
    message: any,
    key?: string,
    headers?: Record<string, string>,
    maxRetries: number = 3,
    initialDelay: number = 1000,
  ): Promise<void> {
    const span = this.tracingService.startSpan('kafka.producer.sendWithRetry');
    span.setTag('kafka.topic', topic);
    span.setTag('kafka.maxRetries', maxRetries);
    
    let attempts = 0;
    let lastError: Error;
    
    while (attempts <= maxRetries) {
      try {
        if (attempts > 0) {
          this.logger.log(
            `Retry attempt ${attempts}/${maxRetries} for topic ${topic}`,
            'KafkaProducerService',
          );
        }
        
        // Add tracing context to headers
        const tracingHeaders = this.tracingService.getTraceHeaders(span);
        const allHeaders = { ...headers, ...tracingHeaders, 'retry-attempt': String(attempts) };
        
        // Add timestamp if not present
        if (typeof message === 'object' && message !== null && !message.timestamp) {
          message.timestamp = new Date().toISOString();
        }
        
        await this.kafkaService.produce(topic, message, key, allHeaders);
        
        if (attempts > 0) {
          this.logger.log(
            `Successfully sent message to topic ${topic} after ${attempts} retries`,
            'KafkaProducerService',
          );
        }
        
        span.finish();
        return;
      } catch (error) {
        lastError = error;
        attempts++;
        
        if (attempts <= maxRetries) {
          // Calculate delay with exponential backoff and jitter
          const delay = initialDelay * Math.pow(2, attempts - 1) * (0.5 + Math.random() * 0.5);
          
          this.logger.warn(
            `Failed to send message to topic ${topic}: ${error.message}. Retrying in ${delay}ms...`,
            'KafkaProducerService',
          );
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    span.setTag('error', true);
    span.log({ event: 'error', 'error.object': lastError, message: lastError.message });
    span.finish();
    
    this.logger.error(
      `Failed to send message to topic ${topic} after ${maxRetries} retries: ${lastError.message}`,
      lastError.stack,
      'KafkaProducerService',
    );
    
    throw lastError;
  }
}