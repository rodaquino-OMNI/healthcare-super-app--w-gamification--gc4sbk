import { Module } from '@nestjs/common'; // v10.3.0
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { KafkaConsumer } from './kafka/kafka.consumer';
import { KafkaProducer } from './kafka/kafka.producer';
import { KafkaModule } from '@app/shared/kafka';
import { LoggerModule } from '@app/shared/logging';
import { TracingModule } from '@app/shared/tracing';
import { ErrorsModule } from '@app/errors';

/**
 * Configures the Events module, importing the controller and service, and setting up Kafka for event handling.
 * This module is responsible for processing events from all journeys (Health, Care, Plan) within the
 * gamification engine, applying rules, and updating user achievements and points.
 *
 * The module integrates with standardized event schemas from @austa/interfaces and implements
 * enhanced error handling with dead-letter queues and retry policies.
 */
@Module({
  imports: [
    KafkaModule.forRoot({
      deadLetterQueue: {
        enabled: true,
        topic: 'gamification.events.dlq'
      },
      retryPolicy: {
        initialDelayMs: 100,
        maxDelayMs: 10000,
        maxRetries: 5,
        backoffFactor: 1.5
      }
    }),
    LoggerModule,
    TracingModule,
    ErrorsModule
  ],
  controllers: [EventsController],
  providers: [EventsService, KafkaConsumer, KafkaProducer],
  exports: [EventsService, KafkaProducer]
})
export class EventsModule {}