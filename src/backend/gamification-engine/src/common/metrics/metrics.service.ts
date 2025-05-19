import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Interface for a metrics timer that can be used to measure durations
 */
export interface MetricsTimer {
  /**
   * Ends the timer and records the duration
   */
  end(): void;
}

/**
 * Service for recording metrics about the application
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly enabled: boolean;

  /**
   * Creates a new instance of the MetricsService
   * 
   * @param configService - Service for accessing configuration
   */
  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<boolean>(
      'gamificationEngine.metrics.enabled',
      true
    );
  }

  /**
   * Increments a counter metric
   * 
   * @param name - The name of the counter
   * @param labels - Optional labels to attach to the metric
   */
  incrementCounter(name: string, labels?: Record<string, string>): void {
    if (!this.enabled) return;

    // In a real implementation, this would use a metrics library like Prometheus
    // For this example, we'll just log it
    this.logger.debug(`Incrementing counter: ${name}`, labels);
  }

  /**
   * Records a gauge metric
   * 
   * @param name - The name of the gauge
   * @param value - The value to record
   * @param labels - Optional labels to attach to the metric
   */
  recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.enabled) return;

    // In a real implementation, this would use a metrics library like Prometheus
    // For this example, we'll just log it
    this.logger.debug(`Recording gauge: ${name} = ${value}`, labels);
  }

  /**
   * Records a histogram metric
   * 
   * @param name - The name of the histogram
   * @param value - The value to record
   * @param labels - Optional labels to attach to the metric
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.enabled) return;

    // In a real implementation, this would use a metrics library like Prometheus
    // For this example, we'll just log it
    this.logger.debug(`Recording histogram: ${name} = ${value}`, labels);
  }

  /**
   * Starts a timer for measuring durations
   * 
   * @param name - The name of the timer
   * @param labels - Optional labels to attach to the metric
   * @returns A timer object that can be used to end the timing
   */
  startTimer(name: string, labels?: Record<string, string>): MetricsTimer {
    if (!this.enabled) {
      // Return a no-op timer if metrics are disabled
      return { end: () => {} };
    }

    const startTime = process.hrtime();

    return {
      end: () => {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const durationMs = (seconds * 1000) + (nanoseconds / 1000000);

        // In a real implementation, this would use a metrics library like Prometheus
        // For this example, we'll just log it
        this.logger.debug(`Timer ${name} duration: ${durationMs.toFixed(3)}ms`, labels);
      },
    };
  }
}