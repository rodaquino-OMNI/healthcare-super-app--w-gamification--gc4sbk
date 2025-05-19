/**
 * Example usage of the MessageSerializer class
 * 
 * This file demonstrates how to use the MessageSerializer in a real-world scenario
 * with the gamification engine's event processing pipeline.
 */

import { Injectable } from '@nestjs/common';
import { Producer } from 'kafkajs';
import { MessageSerializer } from '../message-serializer';
import { GamificationEvent } from '@austa/interfaces/gamification';

/**
 * Example service that publishes health metric events to Kafka
 */
@Injectable()
export class HealthMetricEventPublisher {
  constructor(
    private readonly kafkaProducer: Producer,
    private readonly messageSerializer: MessageSerializer,
  ) {}

  /**
   * Publishes a health metric event to Kafka
   * 
   * @param userId The user ID
   * @param metricType The type of health metric (e.g., STEPS, HEART_RATE)
   * @param value The metric value
   * @param unit The unit of measurement
   * @returns Promise that resolves when the event is published
   */
  async publishHealthMetricEvent(
    userId: string,
    metricType: string,
    value: number,
    unit: string,
  ): Promise<void> {
    // Create the event
    const event: GamificationEvent = {
      eventId: this.generateEventId(),
      type: 'HEALTH_METRIC_RECORDED',
      timestamp: new Date().toISOString(),
      source: 'health-service',
      version: '1.0.0',
      payload: {
        userId,
        metricType,
        value,
        unit,
        recordedAt: new Date().toISOString(),
      },
      metadata: {
        correlationId: this.getCorrelationId(),
      },
    };

    // Serialize the event
    const message = await this.messageSerializer.serialize(event, {
      compress: true,
      headers: {
        'x-source-service': 'health-service',
      },
    });

    // Send the message to Kafka
    await this.kafkaProducer.send({
      topic: 'health-metrics',
      messages: [message],
    });
  }

  /**
   * Example consumer that processes health metric events
   * 
   * @param message The Kafka message to process
   */
  async processHealthMetricEvent(message: any): Promise<void> {
    try {
      // Deserialize the message
      const event = await this.messageSerializer.deserialize<GamificationEvent>(message);

      // Process the event
      console.log(`Processing health metric event: ${event.type}`);
      console.log(`User: ${event.payload.userId}`);
      console.log(`Metric: ${event.payload.metricType} = ${event.payload.value} ${event.payload.unit}`);

      // Update gamification state based on the event
      // ...
    } catch (error) {
      console.error('Failed to process health metric event', error);
      // Handle the error (e.g., send to dead letter queue)
    }
  }

  /**
   * Generates a unique event ID
   */
  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Gets the current correlation ID from the context
   */
  private getCorrelationId(): string {
    // In a real application, this would come from a request context
    // or be generated if not present
    return `corr-${Date.now()}`;
  }
}