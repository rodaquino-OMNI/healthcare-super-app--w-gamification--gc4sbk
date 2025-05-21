/**
 * @file Barrel export file for Kafka-related services and utilities
 * @description This file exports all Kafka-related services and utilities from the events module,
 * providing a clean and organized interface for importing Kafka components throughout the application.
 */

// Import all Kafka-related services and utilities
import { KafkaConsumerService } from './kafka.consumer';
import { KafkaProducerService } from './kafka.producer';
import { DeadLetterQueueService } from './dead-letter-queue.service';

// Named exports for all Kafka-related services and utilities
export {
  KafkaConsumerService,
  KafkaProducerService,
  DeadLetterQueueService
};

/**
 * Default export for convenience when importing all Kafka components
 * Example usage: import KafkaServices from '@app/events/kafka';
 */
export default {
  KafkaConsumerService,
  KafkaProducerService,
  DeadLetterQueueService
};