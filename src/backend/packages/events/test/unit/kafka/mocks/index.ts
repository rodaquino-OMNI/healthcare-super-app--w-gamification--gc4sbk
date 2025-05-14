/**
 * Barrel file that exports all mock implementations for Kafka testing from a single entry point.
 * This file simplifies importing Kafka mocks in test files by providing a centralized export interface.
 * Removing this file would force developers to import individual mock files directly, reducing
 * maintainability and increasing import complexity.
 */

// Export mock Kafka message factories
export * from './mock-kafka-message';

// Export mock serializers
export * from './mock-serializers';

// Export mock journey events
export * from './mock-journey-events';

// Export mock Kafka client, producer, and consumer implementations
// These will be implemented in separate files
// export * from './mock-kafka-client';
// export * from './mock-kafka-producer';
export * from './mock-kafka-consumer';