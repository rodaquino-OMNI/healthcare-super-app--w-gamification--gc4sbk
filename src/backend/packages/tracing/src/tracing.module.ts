import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // v10.0.0+
import { LoggerModule } from '@austa/logging';
import { TracingService } from './tracing.service';

/**
 * Global module that provides distributed tracing capabilities across the AUSTA SuperApp.
 * 
 * This module integrates OpenTelemetry to enable end-to-end request tracing through all journey services,
 * supporting observability requirements for the application. The tracing functionality allows:
 * - Tracking requests as they flow through different microservices
 * - Measuring performance at different stages of request processing
 * - Identifying bottlenecks and errors in the request pipeline
 * - Correlating logs and traces for better debugging
 * - Adding journey-specific context to traces for business process visibility
 * 
 * By marking this module as global, the TracingService is available for dependency injection
 * throughout the application without explicitly importing this module in each feature module.
 * 
 * @example
 * // Import in your application's root module
 * @Module({
 *   imports: [TracingModule],
 *   // ...
 * })
 * export class AppModule {}
 */
@Global()
@Module({
  imports: [LoggerModule, ConfigModule],
  providers: [TracingService],
  exports: [TracingService],
})
export class TracingModule {}