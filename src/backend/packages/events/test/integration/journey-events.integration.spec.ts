import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from '../../src/kafka/kafka.service';
import { EventType, JourneyEvents } from '../../src/dto/event-types.enum';
import { HEALTH_TOPIC, CARE_TOPIC, PLAN_TOPIC, GAMIFICATION_TOPIC } from '../../src/constants/topics.constants';
import { EventErrorCode } from '../../src/constants/errors.constants';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { ConfigService } from '@nestjs/config';
import { EventsModule } from '../../src/events.module';
import { createMock } from '@golevelup/ts-jest';
import { setTimeout as sleep } from 'timers/promises';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

// Import event DTOs
import {
  HealthMetricRecordedEventDto,
  HealthGoalAchievedEventDto,
  DeviceSynchronizedEventDto,
  HealthInsightGeneratedEventDto,
  HealthMetricType,
  HealthGoalType,
  DeviceType,
  HealthInsightType
} from '../../src/dto/health-event.dto';

// Import test fixtures
import {
  healthMetricEvents,
  healthGoalEvents,
  deviceSyncEvents,
  healthInsightEvents
} from '../fixtures/health-events';

import { careEvents } from '../fixtures/care-events';
import { planEventFixtures } from '../fixtures/plan-events';
import { createEventMetadata } from '../../src/dto/event-metadata.dto';

/**
 * Integration tests for journey-specific event processing.
 * 
 * These tests verify that each journey's events are properly structured, validated,
 * and processed according to their specific requirements. It ensures that cross-journey
 * events are properly correlated and that journey-specific business rules are applied correctly.
 */
describe('Journey Events Integration', () => {
  let module: TestingModule;
  let kafkaService: KafkaService;
  let loggerService: LoggerService;
  let configService: ConfigService;
  let mockProducer: any;
  let mockConsumer: any;
  let mockAdmin: any;
  
  beforeEach(async () => {
    // Create mock Kafka client components
    mockProducer = {
      connect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined)
    };
    
    mockConsumer = {
      connect: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
      run: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      resume: jest.fn()
    };
    
    mockAdmin = {
      connect: jest.fn().mockResolvedValue(undefined),
      createTopics: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      fetchTopicMetadata: jest.fn().mockResolvedValue({
        topics: [
          { name: HEALTH_TOPIC },
          { name: CARE_TOPIC },
          { name: PLAN_TOPIC },
          { name: GAMIFICATION_TOPIC }
        ]
      })
    };
    
    // Create test module with mocked dependencies
    module = await Test.createTestingModule({
      imports: [EventsModule],
    })
      .overrideProvider(KafkaService)
      .useValue({
        createProducer: jest.fn().mockReturnValue(mockProducer),
        createConsumer: jest.fn().mockReturnValue(mockConsumer),
        createAdminClient: jest.fn().mockReturnValue(mockAdmin),
        getProducer: jest.fn().mockReturnValue(mockProducer),
        getConsumer: jest.fn().mockReturnValue(mockConsumer),
        getAdminClient: jest.fn().mockReturnValue(mockAdmin),
        sendToDLQ: jest.fn().mockResolvedValue(undefined),
        serialize: jest.fn().mockImplementation((value) => JSON.stringify(value)),
        deserialize: jest.fn().mockImplementation((value) => JSON.parse(value)),
        sendEvent: jest.fn().mockImplementation((topic, event) => {
          return mockProducer.send({
            topic,
            messages: [{
              key: event.metadata?.eventId || 'test-event',
              value: JSON.stringify(event),
              headers: {
                'correlation-id': Buffer.from(event.metadata?.correlationId || ''),
                'user-id': Buffer.from(event.metadata?.userId || '')
              }
            }]
          });
        }),
        processEvent: jest.fn().mockImplementation((event) => {
          // Mock event processing logic
          return Promise.resolve({ success: true, event });
        })
      })
      .overrideProvider(LoggerService)
      .useValue(createMock<LoggerService>())
      .overrideProvider(TracingService)
      .useValue(createMock<TracingService>())
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn().mockImplementation((key) => {
          const config = {
            'kafka.retryAttempts': 3,
            'kafka.initialRetryDelay': 100,
            'kafka.maxRetryDelay': 5000,
            'kafka.retryBackoffMultiplier': 2,
            'kafka.dlqEnabled': true,
            'kafka.brokers': ['localhost:9092'],
            'kafka.clientId': 'test-client',
            'kafka.groupId': 'test-group',
          };
          return config[key];
        })
      })
      .compile();
    
    kafkaService = module.get<KafkaService>(KafkaService);
    loggerService = module.get<LoggerService>(LoggerService);
    configService = module.get<ConfigService>(ConfigService);
    
    // Spy on logger methods
    jest.spyOn(loggerService, 'error');
    jest.spyOn(loggerService, 'warn');
    jest.spyOn(loggerService, 'debug');
    jest.spyOn(loggerService, 'log');
  });
  
  afterEach(async () => {
    await module.close();
    jest.clearAllMocks();
  });

  /**
   * Health Journey Event Tests
   */
  describe('Health Journey Events', () => {
    describe('Health Metric Events', () => {
      it('should validate and process valid health metric events', async () => {
        // Test all health metric event types
        for (const [key, event] of Object.entries(healthMetricEvents)) {
          // Convert plain object to class instance for validation
          const eventDto = plainToInstance(HealthMetricRecordedEventDto, event);
          
          // Validate the event
          const errors = await validate(eventDto);
          expect(errors).toHaveLength(0);
          
          // Send the event
          await kafkaService.sendEvent(HEALTH_TOPIC, event);
          
          // Verify event was sent to the correct topic
          expect(mockProducer.send).toHaveBeenCalledWith({
            topic: HEALTH_TOPIC,
            messages: expect.arrayContaining([expect.objectContaining({
              key: event.metadata.eventId,
              value: expect.any(String)
            })])
          });
          
          // Verify event processing
          expect(kafkaService.processEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              type: JourneyEvents.Health.METRIC_RECORDED,
              journey: 'health',
              data: expect.objectContaining({
                metricType: expect.any(String),
                value: expect.any(Number),
                unit: expect.any(String)
              })
            })
          );
        }
      });
      
      it('should reject health metric events with invalid values', async () => {
        // Create an invalid health metric event (heart rate too high)
        const invalidEvent = {
          ...healthMetricEvents.heartRateMetricEvent,
          data: {
            ...healthMetricEvents.heartRateMetricEvent.data,
            value: 300 // Invalid heart rate (above normal range)
          }
        };
        
        // Convert plain object to class instance for validation
        const eventDto = plainToInstance(HealthMetricRecordedEventDto, invalidEvent);
        
        // Validate the event
        const errors = await validate(eventDto);
        
        // Expect validation to fail
        expect(errors.length).toBeGreaterThan(0);
        
        // Verify the specific validation error
        const valueError = errors.find(error => 
          error.property === 'data' && 
          error.constraints && 
          Object.values(error.constraints).some(msg => 
            msg.includes('value') || msg.includes('range')
          )
        );
        
        expect(valueError).toBeDefined();
        
        // Verify that the event's own validation method would reject it
        expect(eventDto.data.validateMetricRange()).toBe(false);
      });
      
      it('should process health metrics with device correlation', async () => {
        // Use a metric event that has a deviceId
        const metricEvent = healthMetricEvents.heartRateMetricEvent;
        const deviceEvent = deviceSyncEvents.smartwatchSyncEvent;
        
        // Ensure the deviceId matches between events
        const updatedMetricEvent = {
          ...metricEvent,
          data: {
            ...metricEvent.data,
            deviceId: deviceEvent.data.deviceId
          }
        };
        
        // Send both events
        await kafkaService.sendEvent(HEALTH_TOPIC, deviceEvent);
        await kafkaService.sendEvent(HEALTH_TOPIC, updatedMetricEvent);
        
        // Verify both events were sent
        expect(mockProducer.send).toHaveBeenCalledTimes(2);
        
        // Verify correlation between events
        expect(kafkaService.processEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              deviceId: deviceEvent.data.deviceId
            })
          })
        );
      });
    });
    
    describe('Health Goal Events', () => {
      it('should validate and process health goal achievement events', async () => {
        // Test all health goal event types
        for (const [key, event] of Object.entries(healthGoalEvents)) {
          // Convert plain object to class instance for validation
          const eventDto = plainToInstance(HealthGoalAchievedEventDto, event);
          
          // Validate the event
          const errors = await validate(eventDto);
          expect(errors).toHaveLength(0);
          
          // Send the event
          await kafkaService.sendEvent(HEALTH_TOPIC, event);
          
          // Verify event was sent to the correct topic
          expect(mockProducer.send).toHaveBeenCalledWith({
            topic: HEALTH_TOPIC,
            messages: expect.arrayContaining([expect.objectContaining({
              key: event.metadata.eventId,
              value: expect.any(String)
            })])
          });
          
          // Verify event processing
          expect(kafkaService.processEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              type: JourneyEvents.Health.GOAL_ACHIEVED,
              journey: 'health',
              data: expect.objectContaining({
                goalId: expect.any(String),
                goalType: expect.any(String)
              })
            })
          );
          
          // Verify goal achievement status
          if (event.data.achievedAt) {
            expect(eventDto.data.isAchieved()).toBe(true);
          }
        }
      });
      
      it('should track goal progress correctly', async () => {
        // Use a partially completed goal
        const partialGoalEvent = healthGoalEvents.weightGoalPartialEvent;
        
        // Convert plain object to class instance
        const eventDto = plainToInstance(HealthGoalAchievedEventDto, partialGoalEvent);
        
        // Verify initial state
        expect(eventDto.data.isAchieved()).toBe(false);
        expect(eventDto.data.progressPercentage).toBeLessThan(100);
        
        // Mark the goal as achieved
        eventDto.data.markAsAchieved();
        
        // Verify updated state
        expect(eventDto.data.isAchieved()).toBe(true);
        expect(eventDto.data.progressPercentage).toBe(100);
        expect(eventDto.data.achievedAt).toBeDefined();
      });
    });
    
    describe('Device Synchronization Events', () => {
      it('should validate and process device sync events', async () => {
        // Test all device sync event types
        for (const [key, event] of Object.entries(deviceSyncEvents)) {
          // Convert plain object to class instance for validation
          const eventDto = plainToInstance(DeviceSynchronizedEventDto, event);
          
          // Validate the event
          const errors = await validate(eventDto);
          expect(errors).toHaveLength(0);
          
          // Send the event
          await kafkaService.sendEvent(HEALTH_TOPIC, event);
          
          // Verify event was sent to the correct topic
          expect(mockProducer.send).toHaveBeenCalledWith({
            topic: HEALTH_TOPIC,
            messages: expect.arrayContaining([expect.objectContaining({
              key: event.metadata.eventId,
              value: expect.any(String)
            })])
          });
          
          // Verify event processing
          expect(kafkaService.processEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              type: JourneyEvents.Health.DEVICE_CONNECTED,
              journey: 'health',
              data: expect.objectContaining({
                deviceId: expect.any(String),
                deviceType: expect.any(String),
                syncSuccessful: expect.any(Boolean)
              })
            })
          );
        }
      });
      
      it('should handle failed device synchronization correctly', async () => {
        // Use a failed device sync event
        const failedSyncEvent = deviceSyncEvents.failedGlucoseMonitorSyncEvent;
        
        // Convert plain object to class instance
        const eventDto = plainToInstance(DeviceSynchronizedEventDto, failedSyncEvent);
        
        // Verify initial state
        expect(eventDto.data.syncSuccessful).toBe(false);
        expect(eventDto.data.errorMessage).toBeDefined();
        
        // Test marking as successful
        eventDto.data.markAsSuccessful(5, [HealthMetricType.BLOOD_GLUCOSE]);
        
        // Verify updated state
        expect(eventDto.data.syncSuccessful).toBe(true);
        expect(eventDto.data.dataPointsCount).toBe(5);
        expect(eventDto.data.metricTypes).toContain(HealthMetricType.BLOOD_GLUCOSE);
        expect(eventDto.data.errorMessage).toBeUndefined();
        
        // Test marking as failed again
        eventDto.data.markAsFailed('New error message');
        
        // Verify updated state
        expect(eventDto.data.syncSuccessful).toBe(false);
        expect(eventDto.data.errorMessage).toBe('New error message');
      });
    });
    
    describe('Health Insight Events', () => {
      it('should validate and process health insight events', async () => {
        // Test all health insight event types
        for (const [key, event] of Object.entries(healthInsightEvents)) {
          // Convert plain object to class instance for validation
          const eventDto = plainToInstance(HealthInsightGeneratedEventDto, event);
          
          // Validate the event
          const errors = await validate(eventDto);
          expect(errors).toHaveLength(0);
          
          // Send the event
          await kafkaService.sendEvent(HEALTH_TOPIC, event);
          
          // Verify event was sent to the correct topic
          expect(mockProducer.send).toHaveBeenCalledWith({
            topic: HEALTH_TOPIC,
            messages: expect.arrayContaining([expect.objectContaining({
              key: event.metadata.eventId,
              value: expect.any(String)
            })])
          });
          
          // Verify event processing
          expect(kafkaService.processEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              type: JourneyEvents.Health.INSIGHT_GENERATED,
              journey: 'health',
              data: expect.objectContaining({
                insightId: expect.any(String),
                insightType: expect.any(String),
                title: expect.any(String),
                description: expect.any(String)
              })
            })
          );
        }
      });
      
      it('should identify high-priority health insights correctly', async () => {
        // Test high-priority insight types
        const highPriorityInsights = [
          healthInsightEvents.anomalyDetectionInsightEvent,
          healthInsightEvents.healthRiskAssessmentInsightEvent
        ];
        
        // Test regular insights
        const regularInsights = [
          healthInsightEvents.trendAnalysisInsightEvent,
          healthInsightEvents.preventiveRecommendationInsightEvent,
          healthInsightEvents.goalSuggestionInsightEvent
        ];
        
        // Verify high-priority insights
        for (const event of highPriorityInsights) {
          const eventDto = plainToInstance(HealthInsightGeneratedEventDto, event);
          expect(eventDto.data.isHighPriority()).toBe(true);
        }
        
        // Verify regular insights
        for (const event of regularInsights) {
          const eventDto = plainToInstance(HealthInsightGeneratedEventDto, event);
          expect(eventDto.data.isHighPriority()).toBe(false);
        }
      });
      
      it('should track user acknowledgment of insights', async () => {
        // Use an unacknowledged insight
        const insight = healthInsightEvents.anomalyDetectionInsightEvent;
        
        // Convert plain object to class instance
        const eventDto = plainToInstance(HealthInsightGeneratedEventDto, insight);
        
        // Verify initial state
        expect(eventDto.data.userAcknowledged).toBe(false);
        
        // Acknowledge the insight
        eventDto.data.acknowledgeByUser();
        
        // Verify updated state
        expect(eventDto.data.userAcknowledged).toBe(true);
      });
    });
  });

  /**
   * Care Journey Event Tests
   */
  describe('Care Journey Events', () => {
    describe('Appointment Events', () => {
      it('should validate and process appointment booking events', async () => {
        // Test all appointment booking event types
        for (const [key, event] of Object.entries(careEvents.appointmentBookedEvents)) {
          // Send the event
          await kafkaService.sendEvent(CARE_TOPIC, event);
          
          // Verify event was sent to the correct topic
          expect(mockProducer.send).toHaveBeenCalledWith({
            topic: CARE_TOPIC,
            messages: expect.arrayContaining([expect.objectContaining({
              value: expect.any(String)
            })])
          });
          
          // Verify event processing
          expect(kafkaService.processEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              type: JourneyEvents.Care.APPOINTMENT_BOOKED,
              journey: 'care',
              data: expect.objectContaining({
                appointmentId: expect.any(String),
                providerId: expect.any(String),
                appointmentType: expect.any(String),
                scheduledAt: expect.any(String),
                bookedAt: expect.any(String)
              })
            })
          );
        }
      });
      
      it('should validate and process appointment completion events', async () => {
        // Test all appointment completion event types
        for (const [key, event] of Object.entries(careEvents.appointmentCompletedEvents)) {
          // Send the event
          await kafkaService.sendEvent(CARE_TOPIC, event);
          
          // Verify event was sent to the correct topic
          expect(mockProducer.send).toHaveBeenCalledWith({
            topic: CARE_TOPIC,
            messages: expect.arrayContaining([expect.objectContaining({
              value: expect.any(String)
            })])
          });
          
          // Verify event processing
          expect(kafkaService.processEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              type: JourneyEvents.Care.APPOINTMENT_COMPLETED,
              journey: 'care',
              data: expect.objectContaining({
                appointmentId: expect.any(String),
                providerId: expect.any(String),
                status: expect.any(String)
              })
            })
          );
        }
      });
      
      it('should correlate appointment booking and completion events', async () => {
        // Use matching appointment booking and completion events
        const bookingEvent = careEvents.appointmentBookedEvents.standard;
        const completionEvent = careEvents.appointmentCompletedEvents.standard;
        
        // Ensure they have the same appointmentId
        expect(bookingEvent.data.appointmentId).toBe(completionEvent.data.appointmentId);
        
        // Send both events
        await kafkaService.sendEvent(CARE_TOPIC, bookingEvent);
        await kafkaService.sendEvent(CARE_TOPIC, completionEvent);
        
        // Verify both events were sent
        expect(mockProducer.send).toHaveBeenCalledTimes(2);
        
        // Verify correlation between events
        expect(kafkaService.processEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              appointmentId: bookingEvent.data.appointmentId
            })
          })
        );
      });
    });
    
    describe('Medication Events', () => {
      it('should validate and process medication adherence events', async () => {
        // Test all medication taken event types
        for (const [key, event] of Object.entries(careEvents.medicationTakenEvents)) {
          // Send the event
          await kafkaService.sendEvent(CARE_TOPIC, event);
          
          // Verify event was sent to the correct topic
          expect(mockProducer.send).toHaveBeenCalledWith({
            topic: CARE_TOPIC,
            messages: expect.arrayContaining([expect.objectContaining({
              value: expect.any(String)
            })])
          });
          
          // Verify event processing
          expect(kafkaService.processEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              type: JourneyEvents.Care.MEDICATION_TAKEN,
              journey: 'care',
              data: expect.objectContaining({
                // Check for either single medication or multiple medications
                ...(event.data.medicationId ? { medicationId: expect.any(String) } : {}),
                ...(event.data.medications ? { medications: expect.any(Array) } : {}),
                adherence: expect.any(String)
              })
            })
          );
        }
      });
      
      it('should handle different medication adherence statuses', async () => {
        // Test different adherence statuses
        const adherenceEvents = [
          careEvents.medicationTakenEvents.onTime,
          careEvents.medicationTakenEvents.late,
          careEvents.medicationTakenEvents.missed,
          careEvents.medicationTakenEvents.skipped
        ];
        
        for (const event of adherenceEvents) {
          // Send the event
          await kafkaService.sendEvent(CARE_TOPIC, event);
          
          // Verify event processing with specific adherence status
          expect(kafkaService.processEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({
                adherence: event.data.adherence
              })
            })
          );
        }
      });
    });
    
    describe('Telemedicine Events', () => {
      it('should validate and process telemedicine session events', async () => {
        // Test all telemedicine event types
        for (const [key, event] of Object.entries(careEvents.telemedicineEvents)) {
          // Send the event
          await kafkaService.sendEvent(CARE_TOPIC, event);
          
          // Verify event was sent to the correct topic
          expect(mockProducer.send).toHaveBeenCalledWith({
            topic: CARE_TOPIC,
            messages: expect.arrayContaining([expect.objectContaining({
              value: expect.any(String)
            })])
          });
          
          // Verify event processing
          expect(kafkaService.processEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              journey: 'care',
              data: expect.objectContaining({
                sessionId: expect.any(String),
                appointmentId: expect.any(String),
                providerId: expect.any(String)
              })
            })
          );
        }
      });
      
      it('should correlate telemedicine start and completion events', async () => {
        // Use matching telemedicine start and completion events
        const startEvent = careEvents.telemedicineEvents.started;
        const completionEvent = careEvents.telemedicineEvents.completed;
        
        // Ensure they have the same sessionId
        expect(startEvent.data.sessionId).toBe(completionEvent.data.sessionId);
        
        // Send both events
        await kafkaService.sendEvent(CARE_TOPIC, startEvent);
        await kafkaService.sendEvent(CARE_TOPIC, completionEvent);
        
        // Verify both events were sent
        expect(mockProducer.send).toHaveBeenCalledTimes(2);
        
        // Verify correlation between events
        expect(kafkaService.processEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              sessionId: startEvent.data.sessionId
            })
          })
        );
      });
    });
    
    describe('Care Plan Events', () => {
      it('should validate and process care plan events', async () => {
        // Test all care plan event types
        for (const [key, event] of Object.entries(careEvents.carePlanEvents)) {
          // Send the event
          await kafkaService.sendEvent(CARE_TOPIC, event);
          
          // Verify event was sent to the correct topic
          expect(mockProducer.send).toHaveBeenCalledWith({
            topic: CARE_TOPIC,
            messages: expect.arrayContaining([expect.objectContaining({
              value: expect.any(String)
            })])
          });
          
          // Verify event processing
          expect(kafkaService.processEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              journey: 'care',
              data: expect.objectContaining({
                // Check for either plan creation or task completion
                ...(event.data.planId ? { planId: expect.any(String) } : {}),
                ...(event.data.taskId ? { taskId: expect.any(String) } : {})
              })
            })
          );
        }
      });
      
      it('should correlate care plan and task completion events', async () => {
        // Use matching care plan and task completion events
        const planEvent = careEvents.carePlanEvents.created;
        const taskEvent = careEvents.carePlanEvents.medicationTaskCompleted;
        
        // Ensure they have the same planId
        expect(taskEvent.data.planId).toBe(planEvent.data.planId);
        
        // Send both events
        await kafkaService.sendEvent(CARE_TOPIC, planEvent);
        await kafkaService.sendEvent(CARE_TOPIC, taskEvent);
        
        // Verify both events were sent
        expect(mockProducer.send).toHaveBeenCalledTimes(2);
        
        // Verify correlation between events
        expect(kafkaService.processEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              planId: planEvent.data.planId
            })
          })
        );
      });
    });
  });

  /**
   * Plan Journey Event Tests
   */
  describe('Plan Journey Events', () => {
    describe('Claim Events', () => {
      it('should validate and process claim submission events', async () => {
        // Test all claim submission event types
        for (const [key, event] of Object.entries(planEventFixtures.claimSubmission)) {
          // Send the event
          await kafkaService.sendEvent(PLAN_TOPIC, event);
          
          // Verify event was sent to the correct topic
          expect(mockProducer.send).toHaveBeenCalledWith({
            topic: PLAN_TOPIC,
            messages: expect.arrayContaining([expect.objectContaining({
              value: expect.any(String)
            })])
          });
          
          // Verify event processing
          expect(kafkaService.processEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              type: EventType.PLAN_CLAIM_SUBMITTED,
              journey: 'plan',
              data: expect.objectContaining({
                claimId: expect.any(String),
                claimType: expect.any(String),
                amount: expect.any(Number)
              })
            })
          );
        }
      });
      
      it('should validate and process claim processing events', async () => {
        // Test all claim processing event types
        for (const [key, event] of Object.entries(planEventFixtures.claimProcessing)) {
          // Send the event
          await kafkaService.sendEvent(PLAN_TOPIC, event);
          
          // Verify event was sent to the correct topic
          expect(mockProducer.send).toHaveBeenCalledWith({
            topic: PLAN_TOPIC,
            messages: expect.arrayContaining([expect.objectContaining({
              value: expect.any(String)
            })])
          });
          
          // Verify event processing
          expect(kafkaService.processEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              type: EventType.PLAN_CLAIM_PROCESSED,
              journey: 'plan',
              data: expect.objectContaining({
                claimId: expect.any(String),
                status: expect.any(String),
                amount: expect.any(Number)
              })
            })
          );
        }
      });
      
      it('should correlate claim submission and processing events', async () => {
        // Create a sequence of related claim events
        const claimSequence = planEventFixtures.createClaimSequence(
          'test-user-123',
          {
            claimType: planEventFixtures.ClaimType.MEDICAL,
            amount: 250,
            status: planEventFixtures.ClaimStatus.APPROVED
          }
        );
        
        // Extract submission and processing events
        const [submissionEvent, processingEvent] = claimSequence;
        
        // Ensure they have the same claimId
        expect(submissionEvent.data.claimId).toBe(processingEvent.data.claimId);
        
        // Send both events
        await kafkaService.sendEvent(PLAN_TOPIC, submissionEvent);
        await kafkaService.sendEvent(PLAN_TOPIC, processingEvent);
        
        // Verify both events were sent
        expect(mockProducer.send).toHaveBeenCalledTimes(2);
        
        // Verify correlation between events
        expect(kafkaService.processEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              claimId: submissionEvent.data.claimId
            })
          })
        );
      });
    });
    
    describe('Benefit Events', () => {
      it('should validate and process benefit utilization events', async () => {
        // Test all benefit utilization event types
        for (const [key, event] of Object.entries(planEventFixtures.benefitUtilization)) {
          // Send the event
          await kafkaService.sendEvent(PLAN_TOPIC, event);
          
          // Verify event was sent to the correct topic
          expect(mockProducer.send).toHaveBeenCalledWith({
            topic: PLAN_TOPIC,
            messages: expect.arrayContaining([expect.objectContaining({
              value: expect.any(String)
            })])
          });
          
          // Verify event processing
          expect(kafkaService.processEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              type: EventType.PLAN_BENEFIT_UTILIZED,
              journey: 'plan',
              data: expect.objectContaining({
                benefitId: expect.any(String),
                benefitType: expect.any(String),
                savingsAmount: expect.any(Number)
              })
            })
          );
        }
      });
      
      it('should track benefit utilization sequence', async () => {
        // Create a sequence of benefit utilization events
        const benefitSequence = planEventFixtures.createBenefitUtilizationSequence(
          'test-user-123',
          3,
          planEventFixtures.BenefitType.WELLNESS
        );
        
        // Send all events in the sequence
        for (const event of benefitSequence) {
          await kafkaService.sendEvent(PLAN_TOPIC, event);
        }
        
        // Verify all events were sent
        expect(mockProducer.send).toHaveBeenCalledTimes(benefitSequence.length);
        
        // Verify all events were processed
        expect(kafkaService.processEvent).toHaveBeenCalledTimes(benefitSequence.length);
        
        // Verify the events were for the same user
        for (const event of benefitSequence) {
          expect(kafkaService.processEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              userId: 'test-user-123',
              journey: 'plan',
              type: EventType.PLAN_BENEFIT_UTILIZED
            })
          );
        }
      });
    });
    
    describe('Plan Selection Events', () => {
      it('should validate and process plan selection events', async () => {
        // Test all plan selection event types
        for (const [key, event] of Object.entries(planEventFixtures.planSelection)) {
          // Send the event
          await kafkaService.sendEvent(PLAN_TOPIC, event);
          
          // Verify event was sent to the correct topic
          expect(mockProducer.send).toHaveBeenCalledWith({
            topic: PLAN_TOPIC,
            messages: expect.arrayContaining([expect.objectContaining({
              value: expect.any(String)
            })])
          });
          
          // Verify event processing
          expect(kafkaService.processEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              type: EventType.PLAN_SELECTED,
              journey: 'plan',
              data: expect.objectContaining({
                planId: expect.any(String),
                planType: expect.any(String),
                premium: expect.any(Number)
              })
            })
          );
        }
      });
      
      it('should handle plan upgrades with previous plan correlation', async () => {
        // Use a plan upgrade event with previous plan reference
        const planUpgradeEvent = planEventFixtures.planSelection.planUpgrade;
        
        // Verify it has a previous plan reference
        expect(planUpgradeEvent.data.previousPlanId).toBeDefined();
        
        // Send the event
        await kafkaService.sendEvent(PLAN_TOPIC, planUpgradeEvent);
        
        // Verify event processing with previous plan correlation
        expect(kafkaService.processEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              previousPlanId: planUpgradeEvent.data.previousPlanId,
              annualSavings: expect.any(Number)
            })
          })
        );
      });
    });
    
    describe('Reward Events', () => {
      it('should validate and process reward redemption events', async () => {
        // Test all reward redemption event types
        for (const [key, event] of Object.entries(planEventFixtures.rewardRedemption)) {
          // Send the event
          await kafkaService.sendEvent(PLAN_TOPIC, event);
          
          // Verify event was sent to the correct topic
          expect(mockProducer.send).toHaveBeenCalledWith({
            topic: PLAN_TOPIC,
            messages: expect.arrayContaining([expect.objectContaining({
              value: expect.any(String)
            })])
          });
          
          // Verify event processing
          expect(kafkaService.processEvent).toHaveBeenCalledWith(
            expect.objectContaining({
              type: EventType.PLAN_REWARD_REDEEMED,
              journey: 'plan',
              data: expect.objectContaining({
                rewardId: expect.any(String),
                rewardType: expect.any(String),
                pointsRedeemed: expect.any(Number),
                value: expect.any(Number)
              })
            })
          );
        }
      });
      
      it('should correlate point earning and reward redemption', async () => {
        // Create a sequence with point earning and redemption
        const rewardSequence = planEventFixtures.createRewardRedemptionSequence(
          'test-user-123',
          {
            rewardType: planEventFixtures.RewardType.GIFT_CARD,
            pointsEarned: 500,
            pointsRedeemed: 300
          }
        );
        
        // Extract points and redemption events
        const [pointsEvent, redemptionEvent] = rewardSequence;
        
        // Send both events
        await kafkaService.sendEvent(GAMIFICATION_TOPIC, pointsEvent);
        await kafkaService.sendEvent(PLAN_TOPIC, redemptionEvent);
        
        // Verify both events were sent to their respective topics
        expect(mockProducer.send).toHaveBeenCalledWith(
          expect.objectContaining({ topic: GAMIFICATION_TOPIC })
        );
        expect(mockProducer.send).toHaveBeenCalledWith(
          expect.objectContaining({ topic: PLAN_TOPIC })
        );
        
        // Verify correlation between events (same user)
        expect(pointsEvent.userId).toBe(redemptionEvent.userId);
        
        // Verify points earned is greater than or equal to points redeemed
        expect(pointsEvent.data.points).toBeGreaterThanOrEqual(redemptionEvent.data.pointsRedeemed);
      });
    });
  });

  /**
   * Cross-Journey Event Tests
   */
  describe('Cross-Journey Events', () => {
    it('should correlate health metrics with care appointments', async () => {
      // Create a health metric event and a care appointment event for the same user
      const userId = 'cross-journey-user-123';
      const correlationId = 'correlation-123';
      
      // Create a blood pressure metric event
      const bpMetricEvent = {
        ...healthMetricEvents.bloodPressureMetricEvent,
        userId,
        metadata: createEventMetadata('health-service', { correlationId, userId })
      };
      
      // Create an appointment completion event
      const appointmentEvent = {
        ...careEvents.appointmentCompletedEvents.standard,
        userId,
        metadata: {
          ...careEvents.appointmentCompletedEvents.standard.metadata,
          correlationId,
          userId
        }
      };
      
      // Send both events
      await kafkaService.sendEvent(HEALTH_TOPIC, bpMetricEvent);
      await kafkaService.sendEvent(CARE_TOPIC, appointmentEvent);
      
      // Verify events were sent to their respective topics
      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({ topic: HEALTH_TOPIC })
      );
      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({ topic: CARE_TOPIC })
      );
      
      // Verify correlation between events (same user and correlation ID)
      expect(bpMetricEvent.userId).toBe(appointmentEvent.userId);
      expect(bpMetricEvent.metadata.correlationId).toBe(appointmentEvent.metadata.correlationId);
    });
    
    it('should correlate care appointments with plan claims', async () => {
      // Create a care appointment event and a plan claim event for the same user
      const userId = 'cross-journey-user-456';
      const correlationId = 'correlation-456';
      const providerId = 'provider-123';
      
      // Create an appointment completion event
      const appointmentEvent = {
        ...careEvents.appointmentCompletedEvents.standard,
        userId,
        data: {
          ...careEvents.appointmentCompletedEvents.standard.data,
          providerId
        },
        metadata: {
          ...careEvents.appointmentCompletedEvents.standard.metadata,
          correlationId,
          userId
        }
      };
      
      // Create a claim submission event
      const claimEvent = planEventFixtures.createClaimSubmittedEvent(
        userId,
        {
          claimType: planEventFixtures.ClaimType.MEDICAL,
          providerId,
          amount: 250,
          description: 'Appointment with cardiologist'
        }
      );
      claimEvent.metadata = {
        ...claimEvent.metadata,
        correlationId,
        userId
      };
      
      // Send both events
      await kafkaService.sendEvent(CARE_TOPIC, appointmentEvent);
      await kafkaService.sendEvent(PLAN_TOPIC, claimEvent);
      
      // Verify events were sent to their respective topics
      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({ topic: CARE_TOPIC })
      );
      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({ topic: PLAN_TOPIC })
      );
      
      // Verify correlation between events (same user, provider, and correlation ID)
      expect(appointmentEvent.userId).toBe(claimEvent.userId);
      expect(appointmentEvent.data.providerId).toBe(claimEvent.data.providerId);
      expect(appointmentEvent.metadata.correlationId).toBe(claimEvent.metadata.correlationId);
    });
    
    it('should generate gamification events from journey activities', async () => {
      // Create a complete plan journey with multiple events
      const userId = 'gamification-user-123';
      const planJourney = planEventFixtures.createCompletePlanJourney(userId);
      
      // Find the gamification points event
      const pointsEvent = planJourney.find(event => 
        event.type === EventType.GAMIFICATION_POINTS_EARNED
      );
      
      // Verify points event exists
      expect(pointsEvent).toBeDefined();
      
      // Send the points event
      await kafkaService.sendEvent(GAMIFICATION_TOPIC, pointsEvent);
      
      // Verify event was sent to the gamification topic
      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({ topic: GAMIFICATION_TOPIC })
      );
      
      // Verify event processing
      expect(kafkaService.processEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.GAMIFICATION_POINTS_EARNED,
          journey: 'gamification',
          userId,
          data: expect.objectContaining({
            points: expect.any(Number),
            sourceType: expect.any(String),
            sourceId: expect.any(String)
          })
        })
      );
    });
    
    it('should track achievement progress across journeys', async () => {
      // Create events from different journeys for the same user
      const userId = 'achievement-user-123';
      const correlationId = 'achievement-correlation-123';
      
      // Create a health goal achievement event
      const healthGoalEvent = {
        ...healthGoalEvents.stepsGoalAchievedEvent,
        userId,
        metadata: createEventMetadata('health-service', { correlationId, userId })
      };
      
      // Create a care appointment completion event
      const appointmentEvent = {
        ...careEvents.appointmentCompletedEvents.standard,
        userId,
        metadata: {
          ...careEvents.appointmentCompletedEvents.standard.metadata,
          correlationId,
          userId
        }
      };
      
      // Create a plan claim approval event
      const claimEvent = planEventFixtures.claimProcessing.approvedClaim;
      claimEvent.userId = userId;
      claimEvent.metadata = {
        ...claimEvent.metadata,
        correlationId,
        userId
      };
      
      // Create an achievement unlocked event
      const achievementEvent = {
        type: EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
        journey: 'gamification',
        userId,
        data: {
          achievementId: 'achievement-123',
          achievementType: 'cross_journey_master',
          tier: 'gold',
          points: 500,
          unlockedAt: new Date().toISOString()
        },
        metadata: {
          source: 'gamification-engine',
          correlationId,
          userId,
          timestamp: new Date().toISOString()
        }
      };
      
      // Send all events
      await kafkaService.sendEvent(HEALTH_TOPIC, healthGoalEvent);
      await kafkaService.sendEvent(CARE_TOPIC, appointmentEvent);
      await kafkaService.sendEvent(PLAN_TOPIC, claimEvent);
      await kafkaService.sendEvent(GAMIFICATION_TOPIC, achievementEvent);
      
      // Verify all events were sent to their respective topics
      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({ topic: HEALTH_TOPIC })
      );
      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({ topic: CARE_TOPIC })
      );
      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({ topic: PLAN_TOPIC })
      );
      expect(mockProducer.send).toHaveBeenCalledWith(
        expect.objectContaining({ topic: GAMIFICATION_TOPIC })
      );
      
      // Verify all events were for the same user
      expect(healthGoalEvent.userId).toBe(userId);
      expect(appointmentEvent.userId).toBe(userId);
      expect(claimEvent.userId).toBe(userId);
      expect(achievementEvent.userId).toBe(userId);
      
      // Verify all events had the same correlation ID
      expect(healthGoalEvent.metadata.correlationId).toBe(correlationId);
      expect(appointmentEvent.metadata.correlationId).toBe(correlationId);
      expect(claimEvent.metadata.correlationId).toBe(correlationId);
      expect(achievementEvent.metadata.correlationId).toBe(correlationId);
    });
  });
});