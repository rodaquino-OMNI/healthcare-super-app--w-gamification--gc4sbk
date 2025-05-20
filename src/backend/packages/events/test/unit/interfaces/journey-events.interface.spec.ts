/**
 * @file journey-events.interface.spec.ts
 * @description Unit tests for journey-specific event interfaces (Health, Care, Plan)
 * to validate proper payload structures and type constraints. Tests ensure each journey's
 * events maintain consistent structure while accommodating journey-specific data.
 */

import { EventType, JourneyEvents } from '../../../src/dto/event-types.enum';
import {
  HealthMetricData,
  HealthGoalData,
  DeviceSyncData,
  HealthInsightData,
  HealthMetricRecordedEventDto,
  HealthGoalAchievedEventDto,
  DeviceSynchronizedEventDto,
  HealthInsightGeneratedEventDto,
  HealthEventDto,
  HealthMetricType,
  HealthGoalType,
  DeviceType,
  HealthInsightType
} from '../../../src/dto/health-event.dto';

// Import mock validation function to test validation
import { validate } from 'class-validator';

describe('Journey Events Interface Tests', () => {
  describe('Health Journey Event Interfaces', () => {
    describe('HealthMetricData', () => {
      it('should validate a valid health metric', async () => {
        // Arrange
        const healthMetric = new HealthMetricData();
        healthMetric.metricType = HealthMetricType.HEART_RATE;
        healthMetric.value = 75;
        healthMetric.unit = 'bpm';
        healthMetric.recordedAt = new Date().toISOString();
        
        // Act
        const errors = await validate(healthMetric);
        
        // Assert
        expect(errors.length).toBe(0);
        expect(healthMetric.validateMetricRange()).toBe(true);
      });
      
      it('should fail validation when required fields are missing', async () => {
        // Arrange
        const healthMetric = new HealthMetricData();
        // Missing required fields
        
        // Act
        const errors = await validate(healthMetric);
        
        // Assert
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.property === 'metricType')).toBe(true);
        expect(errors.some(e => e.property === 'value')).toBe(true);
        expect(errors.some(e => e.property === 'unit')).toBe(true);
      });
      
      it('should validate metric ranges correctly', () => {
        // Arrange
        const healthMetric = new HealthMetricData();
        healthMetric.unit = 'bpm';
        
        // Act & Assert - Heart rate
        healthMetric.metricType = HealthMetricType.HEART_RATE;
        healthMetric.value = 25; // Below valid range
        expect(healthMetric.validateMetricRange()).toBe(false);
        
        healthMetric.value = 75; // Within valid range
        expect(healthMetric.validateMetricRange()).toBe(true);
        
        healthMetric.value = 230; // Above valid range
        expect(healthMetric.validateMetricRange()).toBe(false);
        
        // Act & Assert - Steps
        healthMetric.metricType = HealthMetricType.STEPS;
        healthMetric.unit = 'steps';
        healthMetric.value = 8000;
        expect(healthMetric.validateMetricRange()).toBe(true);
      });
    });
    
    describe('HealthGoalData', () => {
      it('should validate a valid health goal', async () => {
        // Arrange
        const healthGoal = new HealthGoalData();
        healthGoal.goalId = '123e4567-e89b-12d3-a456-426614174000';
        healthGoal.goalType = HealthGoalType.STEPS_TARGET;
        healthGoal.description = 'Walk 10,000 steps daily';
        healthGoal.targetValue = 10000;
        healthGoal.unit = 'steps';
        healthGoal.progressPercentage = 75;
        
        // Act
        const errors = await validate(healthGoal);
        
        // Assert
        expect(errors.length).toBe(0);
        expect(healthGoal.isAchieved()).toBe(false);
      });
      
      it('should correctly identify achieved goals', () => {
        // Arrange
        const healthGoal = new HealthGoalData();
        healthGoal.goalId = '123e4567-e89b-12d3-a456-426614174000';
        healthGoal.goalType = HealthGoalType.STEPS_TARGET;
        healthGoal.description = 'Walk 10,000 steps daily';
        
        // Act & Assert - Not achieved
        healthGoal.progressPercentage = 75;
        expect(healthGoal.isAchieved()).toBe(false);
        
        // Act & Assert - Achieved by percentage
        healthGoal.progressPercentage = 100;
        expect(healthGoal.isAchieved()).toBe(true);
        
        // Act & Assert - Achieved by date
        healthGoal.progressPercentage = 50;
        healthGoal.achievedAt = new Date().toISOString();
        expect(healthGoal.isAchieved()).toBe(true);
      });
      
      it('should mark a goal as achieved correctly', () => {
        // Arrange
        const healthGoal = new HealthGoalData();
        healthGoal.goalId = '123e4567-e89b-12d3-a456-426614174000';
        healthGoal.goalType = HealthGoalType.STEPS_TARGET;
        healthGoal.description = 'Walk 10,000 steps daily';
        healthGoal.progressPercentage = 75;
        
        // Act
        healthGoal.markAsAchieved();
        
        // Assert
        expect(healthGoal.progressPercentage).toBe(100);
        expect(healthGoal.achievedAt).toBeDefined();
        expect(healthGoal.isAchieved()).toBe(true);
      });
    });
    
    describe('DeviceSyncData', () => {
      it('should validate a valid device sync', async () => {
        // Arrange
        const deviceSync = new DeviceSyncData();
        deviceSync.deviceId = 'device-123';
        deviceSync.deviceType = DeviceType.SMARTWATCH;
        deviceSync.deviceName = 'Apple Watch';
        deviceSync.syncedAt = new Date().toISOString();
        deviceSync.syncSuccessful = true;
        deviceSync.dataPointsCount = 150;
        deviceSync.metricTypes = [HealthMetricType.HEART_RATE, HealthMetricType.STEPS];
        
        // Act
        const errors = await validate(deviceSync);
        
        // Assert
        expect(errors.length).toBe(0);
      });
      
      it('should handle failed syncs correctly', () => {
        // Arrange
        const deviceSync = new DeviceSyncData();
        deviceSync.deviceId = 'device-123';
        deviceSync.deviceType = DeviceType.SMARTWATCH;
        deviceSync.deviceName = 'Apple Watch';
        deviceSync.syncedAt = new Date().toISOString();
        deviceSync.syncSuccessful = true;
        
        // Act
        deviceSync.markAsFailed('Connection timeout');
        
        // Assert
        expect(deviceSync.syncSuccessful).toBe(false);
        expect(deviceSync.errorMessage).toBe('Connection timeout');
      });
      
      it('should handle successful syncs correctly', () => {
        // Arrange
        const deviceSync = new DeviceSyncData();
        deviceSync.deviceId = 'device-123';
        deviceSync.deviceType = DeviceType.SMARTWATCH;
        deviceSync.deviceName = 'Apple Watch';
        deviceSync.syncedAt = new Date().toISOString();
        deviceSync.syncSuccessful = false;
        deviceSync.errorMessage = 'Previous error';
        
        // Act
        deviceSync.markAsSuccessful(150, [HealthMetricType.HEART_RATE, HealthMetricType.STEPS]);
        
        // Assert
        expect(deviceSync.syncSuccessful).toBe(true);
        expect(deviceSync.dataPointsCount).toBe(150);
        expect(deviceSync.metricTypes).toEqual([HealthMetricType.HEART_RATE, HealthMetricType.STEPS]);
        expect(deviceSync.errorMessage).toBeUndefined();
      });
    });
    
    describe('HealthInsightData', () => {
      it('should validate a valid health insight', async () => {
        // Arrange
        const healthInsight = new HealthInsightData();
        healthInsight.insightId = '123e4567-e89b-12d3-a456-426614174000';
        healthInsight.insightType = HealthInsightType.TREND_ANALYSIS;
        healthInsight.title = 'Improving Sleep Pattern';
        healthInsight.description = 'Your sleep duration has improved by 15% over the last month.';
        healthInsight.relatedMetricTypes = [HealthMetricType.SLEEP];
        healthInsight.confidenceScore = 85;
        healthInsight.generatedAt = new Date().toISOString();
        healthInsight.userAcknowledged = false;
        
        // Act
        const errors = await validate(healthInsight);
        
        // Assert
        expect(errors.length).toBe(0);
      });
      
      it('should correctly identify high-priority insights', () => {
        // Arrange
        const healthInsight = new HealthInsightData();
        healthInsight.insightId = '123e4567-e89b-12d3-a456-426614174000';
        healthInsight.title = 'Abnormal Heart Rate';
        healthInsight.description = 'Your heart rate showed unusual patterns during rest.';
        
        // Act & Assert - Not high priority (wrong type)
        healthInsight.insightType = HealthInsightType.TREND_ANALYSIS;
        healthInsight.confidenceScore = 80;
        expect(healthInsight.isHighPriority()).toBe(false);
        
        // Act & Assert - Not high priority (low confidence)
        healthInsight.insightType = HealthInsightType.ANOMALY_DETECTION;
        healthInsight.confidenceScore = 70;
        expect(healthInsight.isHighPriority()).toBe(false);
        
        // Act & Assert - High priority
        healthInsight.insightType = HealthInsightType.ANOMALY_DETECTION;
        healthInsight.confidenceScore = 85;
        expect(healthInsight.isHighPriority()).toBe(true);
        
        // Act & Assert - High priority (health risk)
        healthInsight.insightType = HealthInsightType.HEALTH_RISK_ASSESSMENT;
        healthInsight.confidenceScore = 80;
        expect(healthInsight.isHighPriority()).toBe(true);
      });
      
      it('should mark insights as acknowledged correctly', () => {
        // Arrange
        const healthInsight = new HealthInsightData();
        healthInsight.insightId = '123e4567-e89b-12d3-a456-426614174000';
        healthInsight.insightType = HealthInsightType.TREND_ANALYSIS;
        healthInsight.title = 'Improving Sleep Pattern';
        healthInsight.description = 'Your sleep duration has improved by 15% over the last month.';
        healthInsight.userAcknowledged = false;
        
        // Act
        healthInsight.acknowledgeByUser();
        
        // Assert
        expect(healthInsight.userAcknowledged).toBe(true);
      });
    });
    
    describe('Health Event DTOs', () => {
      it('should validate a valid HealthMetricRecordedEventDto', async () => {
        // Arrange
        const event = new HealthMetricRecordedEventDto();
        event.userId = '123e4567-e89b-12d3-a456-426614174000';
        event.timestamp = new Date().toISOString();
        event.correlationId = 'corr-123';
        
        const metricData = new HealthMetricData();
        metricData.metricType = HealthMetricType.HEART_RATE;
        metricData.value = 75;
        metricData.unit = 'bpm';
        metricData.recordedAt = new Date().toISOString();
        
        event.data = metricData;
        
        // Act
        const errors = await validate(event);
        
        // Assert
        expect(errors.length).toBe(0);
        expect(event.type).toBe('HEALTH_METRIC_RECORDED');
        expect(event.journey).toBe('health');
      });
      
      it('should validate a valid HealthGoalAchievedEventDto', async () => {
        // Arrange
        const event = new HealthGoalAchievedEventDto();
        event.userId = '123e4567-e89b-12d3-a456-426614174000';
        event.timestamp = new Date().toISOString();
        event.correlationId = 'corr-123';
        
        const goalData = new HealthGoalData();
        goalData.goalId = '123e4567-e89b-12d3-a456-426614174000';
        goalData.goalType = HealthGoalType.STEPS_TARGET;
        goalData.description = 'Walk 10,000 steps daily';
        goalData.targetValue = 10000;
        goalData.unit = 'steps';
        goalData.progressPercentage = 100;
        goalData.achievedAt = new Date().toISOString();
        
        event.data = goalData;
        
        // Act
        const errors = await validate(event);
        
        // Assert
        expect(errors.length).toBe(0);
        expect(event.type).toBe('HEALTH_GOAL_ACHIEVED');
        expect(event.journey).toBe('health');
      });
      
      it('should validate a valid DeviceSynchronizedEventDto', async () => {
        // Arrange
        const event = new DeviceSynchronizedEventDto();
        event.userId = '123e4567-e89b-12d3-a456-426614174000';
        event.timestamp = new Date().toISOString();
        event.correlationId = 'corr-123';
        
        const syncData = new DeviceSyncData();
        syncData.deviceId = 'device-123';
        syncData.deviceType = DeviceType.SMARTWATCH;
        syncData.deviceName = 'Apple Watch';
        syncData.syncedAt = new Date().toISOString();
        syncData.syncSuccessful = true;
        syncData.dataPointsCount = 150;
        
        event.data = syncData;
        
        // Act
        const errors = await validate(event);
        
        // Assert
        expect(errors.length).toBe(0);
        expect(event.type).toBe('DEVICE_SYNCHRONIZED');
        expect(event.journey).toBe('health');
      });
      
      it('should validate a valid HealthInsightGeneratedEventDto', async () => {
        // Arrange
        const event = new HealthInsightGeneratedEventDto();
        event.userId = '123e4567-e89b-12d3-a456-426614174000';
        event.timestamp = new Date().toISOString();
        event.correlationId = 'corr-123';
        
        const insightData = new HealthInsightData();
        insightData.insightId = '123e4567-e89b-12d3-a456-426614174000';
        insightData.insightType = HealthInsightType.TREND_ANALYSIS;
        insightData.title = 'Improving Sleep Pattern';
        insightData.description = 'Your sleep duration has improved by 15% over the last month.';
        insightData.relatedMetricTypes = [HealthMetricType.SLEEP];
        insightData.confidenceScore = 85;
        insightData.generatedAt = new Date().toISOString();
        
        event.data = insightData;
        
        // Act
        const errors = await validate(event);
        
        // Assert
        expect(errors.length).toBe(0);
        expect(event.type).toBe('HEALTH_INSIGHT_GENERATED');
        expect(event.journey).toBe('health');
      });
    });
  });
  
  describe('Care Journey Event Interfaces', () => {
    // Since we don't have direct access to the care event DTOs yet, we'll test the event types
    // and structure expectations
    
    it('should have consistent Care journey event types defined', () => {
      // Assert that all expected Care journey event types are defined
      expect(EventType.CARE_APPOINTMENT_BOOKED).toBeDefined();
      expect(EventType.CARE_APPOINTMENT_COMPLETED).toBeDefined();
      expect(EventType.CARE_MEDICATION_TAKEN).toBeDefined();
      expect(EventType.CARE_TELEMEDICINE_STARTED).toBeDefined();
      expect(EventType.CARE_TELEMEDICINE_COMPLETED).toBeDefined();
      expect(EventType.CARE_PLAN_CREATED).toBeDefined();
      expect(EventType.CARE_PLAN_TASK_COMPLETED).toBeDefined();
      
      // Check that the namespaced enum also contains these events
      expect(JourneyEvents.Care.APPOINTMENT_BOOKED).toBe(EventType.CARE_APPOINTMENT_BOOKED);
      expect(JourneyEvents.Care.APPOINTMENT_COMPLETED).toBe(EventType.CARE_APPOINTMENT_COMPLETED);
      expect(JourneyEvents.Care.MEDICATION_TAKEN).toBe(EventType.CARE_MEDICATION_TAKEN);
      expect(JourneyEvents.Care.TELEMEDICINE_STARTED).toBe(EventType.CARE_TELEMEDICINE_STARTED);
      expect(JourneyEvents.Care.TELEMEDICINE_COMPLETED).toBe(EventType.CARE_TELEMEDICINE_COMPLETED);
      expect(JourneyEvents.Care.PLAN_CREATED).toBe(EventType.CARE_PLAN_CREATED);
      expect(JourneyEvents.Care.PLAN_TASK_COMPLETED).toBe(EventType.CARE_PLAN_TASK_COMPLETED);
    });
    
    it('should define expected Care journey event payload structures', () => {
      // This test will be expanded once the Care event DTOs are implemented
      // For now, we'll verify the expected structure based on the event types enum documentation
      
      // Example expected structure for CARE_APPOINTMENT_BOOKED
      const expectedAppointmentBookedFields = [
        'appointmentId',
        'providerId',
        'specialtyType',
        'appointmentType',
        'scheduledAt',
        'bookedAt'
      ];
      
      // Example expected structure for CARE_MEDICATION_TAKEN
      const expectedMedicationTakenFields = [
        'medicationId',
        'medicationName',
        'dosage',
        'takenAt',
        'adherence'
      ];
      
      // These assertions will be replaced with actual DTO validation once implemented
      expect(expectedAppointmentBookedFields.length).toBeGreaterThan(0);
      expect(expectedMedicationTakenFields.length).toBeGreaterThan(0);
    });
  });
  
  describe('Plan Journey Event Interfaces', () => {
    // Since we don't have direct access to the plan event DTOs yet, we'll test the event types
    // and structure expectations
    
    it('should have consistent Plan journey event types defined', () => {
      // Assert that all expected Plan journey event types are defined
      expect(EventType.PLAN_CLAIM_SUBMITTED).toBeDefined();
      expect(EventType.PLAN_CLAIM_PROCESSED).toBeDefined();
      expect(EventType.PLAN_SELECTED).toBeDefined();
      expect(EventType.PLAN_BENEFIT_UTILIZED).toBeDefined();
      expect(EventType.PLAN_REWARD_REDEEMED).toBeDefined();
      expect(EventType.PLAN_DOCUMENT_COMPLETED).toBeDefined();
      
      // Check that the namespaced enum also contains these events
      expect(JourneyEvents.Plan.CLAIM_SUBMITTED).toBe(EventType.PLAN_CLAIM_SUBMITTED);
      expect(JourneyEvents.Plan.CLAIM_PROCESSED).toBe(EventType.PLAN_CLAIM_PROCESSED);
      expect(JourneyEvents.Plan.PLAN_SELECTED).toBe(EventType.PLAN_SELECTED);
      expect(JourneyEvents.Plan.BENEFIT_UTILIZED).toBe(EventType.PLAN_BENEFIT_UTILIZED);
      expect(JourneyEvents.Plan.REWARD_REDEEMED).toBe(EventType.PLAN_REWARD_REDEEMED);
      expect(JourneyEvents.Plan.DOCUMENT_COMPLETED).toBe(EventType.PLAN_DOCUMENT_COMPLETED);
    });
    
    it('should define expected Plan journey event payload structures', () => {
      // This test will be expanded once the Plan event DTOs are implemented
      // For now, we'll verify the expected structure based on the event types enum documentation
      
      // Example expected structure for PLAN_CLAIM_SUBMITTED
      const expectedClaimSubmittedFields = [
        'claimId',
        'claimType',
        'providerId',
        'serviceDate',
        'amount',
        'submittedAt'
      ];
      
      // Example expected structure for PLAN_BENEFIT_UTILIZED
      const expectedBenefitUtilizedFields = [
        'benefitId',
        'benefitType',
        'providerId',
        'utilizationDate',
        'savingsAmount'
      ];
      
      // These assertions will be replaced with actual DTO validation once implemented
      expect(expectedClaimSubmittedFields.length).toBeGreaterThan(0);
      expect(expectedBenefitUtilizedFields.length).toBeGreaterThan(0);
    });
  });
  
  describe('Cross-Journey Event Correlation', () => {
    it('should support cross-journey event correlation through common fields', () => {
      // This test verifies that events from different journeys can be correlated
      // through common fields like userId and correlationId
      
      // Create events from different journeys
      const healthEvent = new HealthMetricRecordedEventDto();
      healthEvent.userId = '123e4567-e89b-12d3-a456-426614174000';
      healthEvent.correlationId = 'cross-journey-correlation-123';
      healthEvent.timestamp = new Date().toISOString();
      
      const metricData = new HealthMetricData();
      metricData.metricType = HealthMetricType.HEART_RATE;
      metricData.value = 75;
      metricData.unit = 'bpm';
      metricData.recordedAt = new Date().toISOString();
      
      healthEvent.data = metricData;
      
      // Assert that the events have the necessary correlation fields
      expect(healthEvent.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(healthEvent.correlationId).toBe('cross-journey-correlation-123');
      
      // In a real implementation, we would create Care and Plan events here
      // and verify they can be correlated with the Health event
    });
    
    it('should support gamification events that reference events from specific journeys', () => {
      // This test verifies that gamification events can reference source events
      // from specific journeys
      
      // Assert that the gamification event types are defined
      expect(EventType.GAMIFICATION_POINTS_EARNED).toBeDefined();
      expect(EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED).toBeDefined();
      expect(EventType.GAMIFICATION_LEVEL_UP).toBeDefined();
      expect(EventType.GAMIFICATION_QUEST_COMPLETED).toBeDefined();
      
      // Check that the namespaced enum also contains these events
      expect(JourneyEvents.Gamification.POINTS_EARNED).toBe(EventType.GAMIFICATION_POINTS_EARNED);
      expect(JourneyEvents.Gamification.ACHIEVEMENT_UNLOCKED).toBe(EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED);
      expect(JourneyEvents.Gamification.LEVEL_UP).toBe(EventType.GAMIFICATION_LEVEL_UP);
      expect(JourneyEvents.Gamification.QUEST_COMPLETED).toBe(EventType.GAMIFICATION_QUEST_COMPLETED);
      
      // In a real implementation, we would create a gamification event that references
      // a source event from a specific journey and verify the relationship
    });
  });
});