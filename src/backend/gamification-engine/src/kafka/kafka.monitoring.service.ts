import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoggerService } from '@app/shared/logging/logger.service';
import { KafkaModuleOptions } from '../kafka.module';

/**
 * Kafka message processing metrics
 */
export interface KafkaMetrics {
  /**
   * Total number of messages received
   */
  messagesReceived: number;
  
  /**
   * Total number of messages sent
   */
  messagesSent: number;
  
  /**
   * Total number of messages that failed processing
   */
  messagesFailed: number;
  
  /**
   * Total number of messages retried
   */
  messagesRetried: number;
  
  /**
   * Total number of messages sent to DLQ
   */
  messagesDlq: number;
  
  /**
   * Average processing time in milliseconds
   */
  avgProcessingTimeMs: number;
  
  /**
   * Messages processed per second
   */
  messagesPerSecond: number;
  
  /**
   * Metrics by topic
   */
  byTopic: Record<string, {
    received: number;
    sent: number;
    failed: number;
    retried: number;
    dlq: number;
    avgProcessingTimeMs: number;
  }>;
  
  /**
   * Last updated timestamp
   */
  lastUpdated: Date;
}

/**
 * Service for monitoring Kafka message processing
 * 
 * Collects and reports metrics on message processing, including throughput,
 * error rates, and processing times.
 */
@Injectable()
export class KafkaMonitoringService implements OnModuleInit {
  private metrics: KafkaMetrics;
  private readonly enabled: boolean;
  private processingTimes: number[] = [];
  private processingTimesByTopic: Record<string, number[]> = {};
  private lastCalculationTime: number = Date.now();
  private messageCountSinceLastCalculation: number = 0;
  
  /**
   * Creates an instance of KafkaMonitoringService
   * 
   * @param logger Logger service for structured logging
   * @param options Kafka module options
   */
  constructor(
    private readonly kafkaService: any, // Using any to avoid circular dependency
    private readonly logger: LoggerService,
    private readonly options: KafkaModuleOptions,
  ) {
    this.enabled = options.enableMonitoring !== undefined ? options.enableMonitoring : true;
    
    this.metrics = {
      messagesReceived: 0,
      messagesSent: 0,
      messagesFailed: 0,
      messagesRetried: 0,
      messagesDlq: 0,
      avgProcessingTimeMs: 0,
      messagesPerSecond: 0,
      byTopic: {},
      lastUpdated: new Date(),
    };
    
    this.logger.log(
      `KafkaMonitoringService initialized (${this.enabled ? 'enabled' : 'disabled'})`,
      'KafkaMonitoringService',
    );
  }

  /**
   * Sets up event listeners and periodic metric calculations on module initialization
   */
  onModuleInit(): void {
    if (!this.enabled) {
      this.logger.log('Monitoring is disabled, skipping initialization', 'KafkaMonitoringService');
      return;
    }
    
    // Set up event listeners for metrics
    process.on('kafka:message:received', (data: any) => this.recordMessageReceived(data));
    process.on('kafka:message:sent', (data: any) => this.recordMessageSent(data));
    process.on('kafka:message:failed', (data: any) => this.recordMessageFailed(data));
    process.on('kafka:message:retried', (data: any) => this.recordMessageRetried(data));
    process.on('kafka:message:dlq', (data: any) => this.recordMessageDlq(data));
    
    // Calculate metrics every 10 seconds
    setInterval(() => this.calculateMetrics(), 10000);
    
    this.logger.log('Kafka monitoring initialized', 'KafkaMonitoringService');
  }

  /**
   * Records a message being received
   * 
   * @param data Message data including topic and start time
   */
  recordMessageReceived(data: { topic: string; startTime: number }): void {
    if (!this.enabled) return;
    
    this.metrics.messagesReceived++;
    this.messageCountSinceLastCalculation++;
    
    if (!this.metrics.byTopic[data.topic]) {
      this.metrics.byTopic[data.topic] = {
        received: 0,
        sent: 0,
        failed: 0,
        retried: 0,
        dlq: 0,
        avgProcessingTimeMs: 0,
      };
      this.processingTimesByTopic[data.topic] = [];
    }
    
    this.metrics.byTopic[data.topic].received++;
  }

  /**
   * Records a message being sent
   * 
   * @param data Message data including topic
   */
  recordMessageSent(data: { topic: string }): void {
    if (!this.enabled) return;
    
    this.metrics.messagesSent++;
    
    if (!this.metrics.byTopic[data.topic]) {
      this.metrics.byTopic[data.topic] = {
        received: 0,
        sent: 0,
        failed: 0,
        retried: 0,
        dlq: 0,
        avgProcessingTimeMs: 0,
      };
      this.processingTimesByTopic[data.topic] = [];
    }
    
    this.metrics.byTopic[data.topic].sent++;
  }

  /**
   * Records a message processing failure
   * 
   * @param data Message data including topic and error
   */
  recordMessageFailed(data: { topic: string; error: Error }): void {
    if (!this.enabled) return;
    
    this.metrics.messagesFailed++;
    
    if (!this.metrics.byTopic[data.topic]) {
      this.metrics.byTopic[data.topic] = {
        received: 0,
        sent: 0,
        failed: 0,
        retried: 0,
        dlq: 0,
        avgProcessingTimeMs: 0,
      };
      this.processingTimesByTopic[data.topic] = [];
    }
    
    this.metrics.byTopic[data.topic].failed++;
  }

  /**
   * Records a message being retried
   * 
   * @param data Message data including topic and attempt number
   */
  recordMessageRetried(data: { topic: string; attempt: number }): void {
    if (!this.enabled) return;
    
    this.metrics.messagesRetried++;
    
    if (!this.metrics.byTopic[data.topic]) {
      this.metrics.byTopic[data.topic] = {
        received: 0,
        sent: 0,
        failed: 0,
        retried: 0,
        dlq: 0,
        avgProcessingTimeMs: 0,
      };
      this.processingTimesByTopic[data.topic] = [];
    }
    
    this.metrics.byTopic[data.topic].retried++;
  }

  /**
   * Records a message being sent to the DLQ
   * 
   * @param data Message data including topic
   */
  recordMessageDlq(data: { topic: string }): void {
    if (!this.enabled) return;
    
    this.metrics.messagesDlq++;
    
    if (!this.metrics.byTopic[data.topic]) {
      this.metrics.byTopic[data.topic] = {
        received: 0,
        sent: 0,
        failed: 0,
        retried: 0,
        dlq: 0,
        avgProcessingTimeMs: 0,
      };
      this.processingTimesByTopic[data.topic] = [];
    }
    
    this.metrics.byTopic[data.topic].dlq++;
  }

  /**
   * Records the processing time for a message
   * 
   * @param data Message data including topic and processing time
   */
  recordProcessingTime(data: { topic: string; processingTimeMs: number }): void {
    if (!this.enabled) return;
    
    this.processingTimes.push(data.processingTimeMs);
    
    if (!this.processingTimesByTopic[data.topic]) {
      this.processingTimesByTopic[data.topic] = [];
    }
    
    this.processingTimesByTopic[data.topic].push(data.processingTimeMs);
    
    // Keep only the last 1000 processing times to avoid memory issues
    if (this.processingTimes.length > 1000) {
      this.processingTimes.shift();
    }
    
    if (this.processingTimesByTopic[data.topic].length > 1000) {
      this.processingTimesByTopic[data.topic].shift();
    }
  }

  /**
   * Calculates metrics based on collected data
   */
  private calculateMetrics(): void {
    if (!this.enabled) return;
    
    // Calculate average processing time
    if (this.processingTimes.length > 0) {
      const sum = this.processingTimes.reduce((acc, time) => acc + time, 0);
      this.metrics.avgProcessingTimeMs = Math.round(sum / this.processingTimes.length);
    }
    
    // Calculate average processing time by topic
    for (const [topic, times] of Object.entries(this.processingTimesByTopic)) {
      if (times.length > 0) {
        const sum = times.reduce((acc, time) => acc + time, 0);
        this.metrics.byTopic[topic].avgProcessingTimeMs = Math.round(sum / times.length);
      }
    }
    
    // Calculate messages per second
    const now = Date.now();
    const elapsedSeconds = (now - this.lastCalculationTime) / 1000;
    this.metrics.messagesPerSecond = Math.round(this.messageCountSinceLastCalculation / elapsedSeconds * 10) / 10;
    
    this.lastCalculationTime = now;
    this.messageCountSinceLastCalculation = 0;
    this.metrics.lastUpdated = new Date();
    
    // Log metrics summary
    this.logger.log(
      `Kafka metrics: ${this.metrics.messagesReceived} received, ` +
      `${this.metrics.messagesSent} sent, ` +
      `${this.metrics.messagesFailed} failed, ` +
      `${this.metrics.messagesRetried} retried, ` +
      `${this.metrics.messagesDlq} DLQ, ` +
      `${this.metrics.avgProcessingTimeMs}ms avg, ` +
      `${this.metrics.messagesPerSecond}/s`,
      'KafkaMonitoringService',
    );
  }

  /**
   * Gets the current metrics
   * 
   * @returns Current Kafka metrics
   */
  getMetrics(): KafkaMetrics {
    return { ...this.metrics };
  }

  /**
   * Resets all metrics
   */
  resetMetrics(): void {
    this.processingTimes = [];
    this.processingTimesByTopic = {};
    this.lastCalculationTime = Date.now();
    this.messageCountSinceLastCalculation = 0;
    
    this.metrics = {
      messagesReceived: 0,
      messagesSent: 0,
      messagesFailed: 0,
      messagesRetried: 0,
      messagesDlq: 0,
      avgProcessingTimeMs: 0,
      messagesPerSecond: 0,
      byTopic: {},
      lastUpdated: new Date(),
    };
    
    this.logger.log('Kafka metrics reset', 'KafkaMonitoringService');
  }
}