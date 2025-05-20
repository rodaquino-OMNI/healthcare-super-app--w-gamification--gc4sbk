/**
 * Kafka integration module for the AUSTA SuperApp.
 * 
 * This module provides a robust implementation of Kafka for event streaming
 * between microservices, with support for:
 * - Type-safe event production and consumption
 * - Schema validation
 * - Dead-letter queues
 * - Retry mechanisms with exponential backoff
 * - Distributed tracing
 * - Journey-specific event processing
 * 
 * @module kafka
 */

// Export the Kafka module
export { KafkaModule } from './kafka.module';

// Export the Kafka service
export { KafkaService } from './kafka.service';

// Re-export interfaces
export { KafkaModuleOptions } from '../interfaces/kafka-options.interface';
export { KafkaMessage } from '../interfaces/kafka-message.interface';

// Re-export DTOs
export { EventMetadataDto, EventVersionDto } from '../dto/event-metadata.dto';

// Re-export errors
export {
  KafkaError,
  EventValidationError,
  ProducerError,
  ConsumerError,
  MessageSerializationError,
} from '../errors/kafka.errors';

// Re-export constants
export { ERROR_CODES, ERROR_MESSAGES } from '../constants/errors.constants';
export { TOPICS } from '../constants/topics.constants';
export { KAFKA_MODULE_OPTIONS, EVENT_SCHEMA_REGISTRY } from '../constants/tokens.constants';