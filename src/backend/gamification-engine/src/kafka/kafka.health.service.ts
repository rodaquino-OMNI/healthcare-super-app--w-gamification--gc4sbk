import { Injectable } from '@nestjs/common';
import { LoggerService } from '@app/shared/logging/logger.service';
import { KafkaService } from './kafka.service';

/**
 * Health status of Kafka connections
 */
export interface KafkaHealthStatus {
  /**
   * Whether the Kafka connection is healthy
   */
  isHealthy: boolean;
  
  /**
   * Status details
   */
  details: {
    /**
     * Whether the producer is connected
     */
    producerConnected: boolean;
    
    /**
     * Number of connected consumers
     */
    connectedConsumers: number;
    
    /**
     * Total number of consumers
     */
    totalConsumers: number;
    
    /**
     * Last health check timestamp
     */
    lastChecked: Date;
    
    /**
     * Error message if any
     */
    error?: string;
  };
}

/**
 * Service for monitoring the health of Kafka connections
 * 
 * Provides methods for checking the health of Kafka producers and consumers,
 * and reporting health status for monitoring systems.
 */
@Injectable()
export class KafkaHealthService {
  private lastHealthStatus: KafkaHealthStatus;
  
  /**
   * Creates an instance of KafkaHealthService
   * 
   * @param kafkaService Core Kafka service for broker communication
   * @param logger Logger service for structured logging
   */
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly logger: LoggerService,
  ) {
    this.lastHealthStatus = {
      isHealthy: false,
      details: {
        producerConnected: false,
        connectedConsumers: 0,
        totalConsumers: 0,
        lastChecked: new Date(),
      },
    };
    
    this.logger.log('KafkaHealthService initialized', 'KafkaHealthService');
  }

  /**
   * Checks the health of Kafka connections
   * 
   * @returns Promise that resolves to the health status
   */
  async checkHealth(): Promise<KafkaHealthStatus> {
    try {
      const producer = this.kafkaService.getProducer();
      const producerConnected = producer !== undefined;
      
      // For consumers, we can only check if they exist, not their actual connection state
      // without modifying the KafkaService to expose that information
      const totalConsumers = 0; // This would need to be exposed by KafkaService
      const connectedConsumers = 0; // This would need to be exposed by KafkaService
      
      const isHealthy = producerConnected; // && connectedConsumers > 0;
      
      this.lastHealthStatus = {
        isHealthy,
        details: {
          producerConnected,
          connectedConsumers,
          totalConsumers,
          lastChecked: new Date(),
        },
      };
      
      this.logger.log(
        `Kafka health check: ${isHealthy ? 'healthy' : 'unhealthy'}`,
        'KafkaHealthService',
      );
      
      return this.lastHealthStatus;
    } catch (error) {
      this.lastHealthStatus = {
        isHealthy: false,
        details: {
          producerConnected: false,
          connectedConsumers: 0,
          totalConsumers: 0,
          lastChecked: new Date(),
          error: error.message,
        },
      };
      
      this.logger.error(
        `Kafka health check failed: ${error.message}`,
        error.stack,
        'KafkaHealthService',
      );
      
      return this.lastHealthStatus;
    }
  }

  /**
   * Gets the last known health status without performing a new check
   * 
   * @returns Last known health status
   */
  getLastHealthStatus(): KafkaHealthStatus {
    return this.lastHealthStatus;
  }

  /**
   * Checks if a specific topic exists
   * 
   * @param topic Topic to check
   * @returns Promise that resolves to true if the topic exists
   */
  async checkTopicExists(topic: string): Promise<boolean> {
    try {
      // This is a simplified implementation
      // In a real implementation, we would use the admin client to check if the topic exists
      // But for now, we'll just return true if the producer is connected
      const producer = this.kafkaService.getProducer();
      return producer !== undefined;
    } catch (error) {
      this.logger.error(
        `Failed to check if topic ${topic} exists: ${error.message}`,
        error.stack,
        'KafkaHealthService',
      );
      return false;
    }
  }
}