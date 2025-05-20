/**
 * @file claim-event.dto.spec.ts
 * @description Unit tests for the ClaimEventDto class that validate insurance claim events
 * (submission, approval, rejection, status updates). Tests verify claim type validation,
 * amount and currency validation, supporting documentation validation, and status transition rules.
 * 
 * These tests ensure that claim-related events are properly validated for gamification and
 * notification processing.
 *
 * @module events/test/unit/dto
 */

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EventType } from '../../../src/dto/event-types.enum';
import { 
  createClaimSubmittedEvent,
  createClaimProcessedEvent,
  ClaimType,
  ClaimStatus,
  createClaimData,
  createInvalidEvent,
  createEventWithInvalidValues,
  validateEventDto,
  isValidEventDto
} from './test-utils';

// We're testing the validation rules for claim events
// The actual DTO classes are imported indirectly through the test utilities
describe('ClaimEventDto', () => {
  describe('ClaimSubmittedEventDto', () => {
    it('should validate a valid claim submission event', async () => {
      // Create a valid claim submission event
      const event = createClaimSubmittedEvent();
      
      // Validate the event
      const isValid = await isValidEventDto(event);
      
      // Assert that the event is valid
      expect(isValid).toBe(true);
    });
    
    it('should validate claim submission events for all claim types', async () => {
      // Test all claim types
      for (const claimType of Object.values(ClaimType)) {
        const event = createClaimSubmittedEvent(claimType);
        const isValid = await isValidEventDto(event);
        expect(isValid).toBe(true);
      }
    });
    
    it('should reject claim submission without required fields', async () => {
      // Create a valid event first
      const validEvent = createClaimSubmittedEvent();
      
      // Create invalid events by removing required fields
      const requiredFields = [
        'data.claimId',
        'data.claimType',
        'data.providerId',
        'data.serviceDate',
        'data.submittedAt',
        'data.amount',
        'data.status'
      ];
      
      for (const field of requiredFields) {
        const invalidEvent = createInvalidEvent(validEvent, [field]);
        const isValid = await isValidEventDto(invalidEvent);
        expect(isValid).toBe(false);
      }
    });
    
    it('should reject claim submission with invalid claim type', async () => {
      // Create a valid event first
      const validEvent = createClaimSubmittedEvent();
      
      // Create an invalid event with an invalid claim type
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'data.claimType': 'INVALID_TYPE'
      });
      
      const isValid = await isValidEventDto(invalidEvent);
      expect(isValid).toBe(false);
    });
    
    it('should reject claim submission with negative or zero amount', async () => {
      // Create a valid event first
      const validEvent = createClaimSubmittedEvent();
      
      // Test with negative amount
      const negativeAmountEvent = createEventWithInvalidValues(validEvent, {
        'data.amount': -100
      });
      
      const isValidNegative = await isValidEventDto(negativeAmountEvent);
      expect(isValidNegative).toBe(false);
      
      // Test with zero amount
      const zeroAmountEvent = createEventWithInvalidValues(validEvent, {
        'data.amount': 0
      });
      
      const isValidZero = await isValidEventDto(zeroAmountEvent);
      expect(isValidZero).toBe(false);
    });
    
    it('should reject claim submission with invalid dates', async () => {
      // Create a valid event first
      const validEvent = createClaimSubmittedEvent();
      
      // Test with invalid service date
      const invalidServiceDateEvent = createEventWithInvalidValues(validEvent, {
        'data.serviceDate': 'not-a-date'
      });
      
      const isValidServiceDate = await isValidEventDto(invalidServiceDateEvent);
      expect(isValidServiceDate).toBe(false);
      
      // Test with invalid submission date
      const invalidSubmissionDateEvent = createEventWithInvalidValues(validEvent, {
        'data.submittedAt': 'not-a-date'
      });
      
      const isValidSubmissionDate = await isValidEventDto(invalidSubmissionDateEvent);
      expect(isValidSubmissionDate).toBe(false);
    });
    
    it('should reject claim submission with future service date', async () => {
      // Create a valid event first
      const validEvent = createClaimSubmittedEvent();
      
      // Create a future date (30 days from now)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      // Test with future service date
      const futureDateEvent = createEventWithInvalidValues(validEvent, {
        'data.serviceDate': futureDate.toISOString()
      });
      
      const isValid = await isValidEventDto(futureDateEvent);
      expect(isValid).toBe(false);
    });
    
    it('should reject claim submission with invalid document IDs', async () => {
      // Create a valid event first
      const validEvent = createClaimSubmittedEvent();
      
      // Test with invalid document IDs (not UUIDs)
      const invalidDocumentIdsEvent = createEventWithInvalidValues(validEvent, {
        'data.documentIds': ['not-a-uuid', '123']
      });
      
      const isValid = await isValidEventDto(invalidDocumentIdsEvent);
      expect(isValid).toBe(false);
    });
    
    it('should validate claim submission with optional fields', async () => {
      // Create a valid event with all optional fields
      const event = createClaimSubmittedEvent(ClaimType.MEDICAL, {
        notes: 'Test notes',
        documentIds: []
      });
      
      // Validate the event
      const isValid = await isValidEventDto(event);
      
      // Assert that the event is valid
      expect(isValid).toBe(true);
    });
    
    it('should validate claim submission with the correct status', async () => {
      // Create a valid event
      const event = createClaimSubmittedEvent();
      
      // Ensure the status is SUBMITTED
      expect(event.data.status).toBe(ClaimStatus.SUBMITTED);
      
      // Validate the event
      const isValid = await isValidEventDto(event);
      expect(isValid).toBe(true);
      
      // Try with an invalid status for submission
      const invalidStatusEvent = createEventWithInvalidValues(event, {
        'data.status': ClaimStatus.APPROVED
      });
      
      const isValidWithInvalidStatus = await isValidEventDto(invalidStatusEvent);
      expect(isValidWithInvalidStatus).toBe(false);
    });
  });
  
  describe('ClaimProcessedEventDto', () => {
    it('should validate a valid claim processed event', async () => {
      // Create a valid claim processed event
      const event = createClaimProcessedEvent();
      
      // Validate the event
      const isValid = await isValidEventDto(event);
      
      // Assert that the event is valid
      expect(isValid).toBe(true);
    });
    
    it('should validate claim processed events for all valid statuses', async () => {
      // Test all valid processed statuses
      const validProcessedStatuses = [
        ClaimStatus.APPROVED,
        ClaimStatus.PARTIALLY_APPROVED,
        ClaimStatus.REJECTED
      ];
      
      for (const status of validProcessedStatuses) {
        const event = createClaimProcessedEvent(ClaimType.MEDICAL, status);
        const isValid = await isValidEventDto(event);
        expect(isValid).toBe(true);
      }
    });
    
    it('should reject claim processed event with invalid status', async () => {
      // Create a valid event first
      const validEvent = createClaimProcessedEvent();
      
      // Test with invalid status for processed event
      const invalidStatusEvent = createEventWithInvalidValues(validEvent, {
        'data.status': ClaimStatus.SUBMITTED
      });
      
      const isValid = await isValidEventDto(invalidStatusEvent);
      expect(isValid).toBe(false);
    });
    
    it('should require coveredAmount for processed claims', async () => {
      // Create a valid event first
      const validEvent = createClaimProcessedEvent();
      
      // Remove coveredAmount
      const invalidEvent = createInvalidEvent(validEvent, ['data.coveredAmount']);
      
      const isValid = await isValidEventDto(invalidEvent);
      expect(isValid).toBe(false);
    });
    
    it('should require processedAt for processed claims', async () => {
      // Create a valid event first
      const validEvent = createClaimProcessedEvent();
      
      // Remove processedAt
      const invalidEvent = createInvalidEvent(validEvent, ['data.processedAt']);
      
      const isValid = await isValidEventDto(invalidEvent);
      expect(isValid).toBe(false);
    });
    
    it('should validate that coveredAmount is not greater than amount', async () => {
      // Create a valid event first
      const validEvent = createClaimProcessedEvent();
      
      // Set coveredAmount greater than amount
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'data.amount': 100,
        'data.coveredAmount': 150
      });
      
      const isValid = await isValidEventDto(invalidEvent);
      expect(isValid).toBe(false);
    });
    
    it('should validate that coveredAmount is zero for rejected claims', async () => {
      // Create a rejected claim event
      const event = createClaimProcessedEvent(ClaimType.MEDICAL, ClaimStatus.REJECTED);
      
      // Ensure coveredAmount is zero
      expect(event.data.coveredAmount).toBe(0);
      
      // Validate the event
      const isValid = await isValidEventDto(event);
      expect(isValid).toBe(true);
      
      // Try with non-zero coveredAmount for rejected claim
      const invalidEvent = createEventWithInvalidValues(event, {
        'data.coveredAmount': 100
      });
      
      const isValidWithNonZeroCoveredAmount = await isValidEventDto(invalidEvent);
      expect(isValidWithNonZeroCoveredAmount).toBe(false);
    });
    
    it('should validate that coveredAmount is less than amount for partially approved claims', async () => {
      // Create a partially approved claim event
      const event = createClaimProcessedEvent(ClaimType.MEDICAL, ClaimStatus.PARTIALLY_APPROVED);
      
      // Ensure coveredAmount is less than amount
      expect(event.data.coveredAmount).toBeLessThan(event.data.amount);
      
      // Validate the event
      const isValid = await isValidEventDto(event);
      expect(isValid).toBe(true);
      
      // Try with coveredAmount equal to amount for partially approved claim
      const invalidEvent = createEventWithInvalidValues(event, {
        'data.coveredAmount': event.data.amount
      });
      
      const isValidWithEqualCoveredAmount = await isValidEventDto(invalidEvent);
      expect(isValidWithEqualCoveredAmount).toBe(false);
    });
    
    it('should validate that coveredAmount equals amount for fully approved claims', async () => {
      // Create a fully approved claim event
      const event = createClaimProcessedEvent(ClaimType.MEDICAL, ClaimStatus.APPROVED);
      
      // Ensure coveredAmount equals amount
      expect(event.data.coveredAmount).toBe(event.data.amount);
      
      // Validate the event
      const isValid = await isValidEventDto(event);
      expect(isValid).toBe(true);
      
      // Try with coveredAmount less than amount for fully approved claim
      const invalidEvent = createEventWithInvalidValues(event, {
        'data.coveredAmount': event.data.amount - 10
      });
      
      const isValidWithLessCoveredAmount = await isValidEventDto(invalidEvent);
      expect(isValidWithLessCoveredAmount).toBe(false);
    });
  });
  
  describe('Claim Status Transitions', () => {
    it('should validate valid status transitions', async () => {
      // Create a claim data object with SUBMITTED status
      const submittedClaim = createClaimData(ClaimType.MEDICAL, ClaimStatus.SUBMITTED);
      
      // Valid transitions from SUBMITTED
      const validTransitionsFromSubmitted = [
        ClaimStatus.UNDER_REVIEW,
        ClaimStatus.ADDITIONAL_INFO_REQUIRED,
        ClaimStatus.REJECTED
      ];
      
      for (const nextStatus of validTransitionsFromSubmitted) {
        // Create a claim update event with the next status
        const updateEvent = {
          type: 'CLAIM_UPDATED',
          journey: 'plan',
          userId: submittedClaim.claimId,
          data: {
            ...submittedClaim,
            status: nextStatus,
            previousStatus: ClaimStatus.SUBMITTED
          }
        };
        
        // Validate the event
        const isValid = await isValidEventDto(updateEvent);
        expect(isValid).toBe(true);
      }
      
      // Create a claim data object with UNDER_REVIEW status
      const underReviewClaim = createClaimData(ClaimType.MEDICAL, ClaimStatus.UNDER_REVIEW);
      
      // Valid transitions from UNDER_REVIEW
      const validTransitionsFromUnderReview = [
        ClaimStatus.ADDITIONAL_INFO_REQUIRED,
        ClaimStatus.APPROVED,
        ClaimStatus.PARTIALLY_APPROVED,
        ClaimStatus.REJECTED
      ];
      
      for (const nextStatus of validTransitionsFromUnderReview) {
        // Create a claim update event with the next status
        const updateEvent = {
          type: 'CLAIM_UPDATED',
          journey: 'plan',
          userId: underReviewClaim.claimId,
          data: {
            ...underReviewClaim,
            status: nextStatus,
            previousStatus: ClaimStatus.UNDER_REVIEW
          }
        };
        
        // Validate the event
        const isValid = await isValidEventDto(updateEvent);
        expect(isValid).toBe(true);
      }
    });
    
    it('should reject invalid status transitions', async () => {
      // Create a claim data object with SUBMITTED status
      const submittedClaim = createClaimData(ClaimType.MEDICAL, ClaimStatus.SUBMITTED);
      
      // Invalid transitions from SUBMITTED
      const invalidTransitionsFromSubmitted = [
        ClaimStatus.APPROVED,
        ClaimStatus.PARTIALLY_APPROVED,
        ClaimStatus.PAYMENT_PENDING,
        ClaimStatus.PAYMENT_PROCESSED
      ];
      
      for (const nextStatus of invalidTransitionsFromSubmitted) {
        // Create a claim update event with the next status
        const updateEvent = {
          type: 'CLAIM_UPDATED',
          journey: 'plan',
          userId: submittedClaim.claimId,
          data: {
            ...submittedClaim,
            status: nextStatus,
            previousStatus: ClaimStatus.SUBMITTED
          }
        };
        
        // Validate the event
        const isValid = await isValidEventDto(updateEvent);
        expect(isValid).toBe(false);
      }
      
      // Create a claim data object with REJECTED status
      const rejectedClaim = createClaimData(ClaimType.MEDICAL, ClaimStatus.REJECTED);
      
      // Invalid transitions from REJECTED (terminal state except for APPEALED)
      const invalidTransitionsFromRejected = [
        ClaimStatus.SUBMITTED,
        ClaimStatus.UNDER_REVIEW,
        ClaimStatus.ADDITIONAL_INFO_REQUIRED,
        ClaimStatus.APPROVED,
        ClaimStatus.PARTIALLY_APPROVED,
        ClaimStatus.PAYMENT_PENDING,
        ClaimStatus.PAYMENT_PROCESSED
      ];
      
      for (const nextStatus of invalidTransitionsFromRejected) {
        // Create a claim update event with the next status
        const updateEvent = {
          type: 'CLAIM_UPDATED',
          journey: 'plan',
          userId: rejectedClaim.claimId,
          data: {
            ...rejectedClaim,
            status: nextStatus,
            previousStatus: ClaimStatus.REJECTED
          }
        };
        
        // Validate the event
        const isValid = await isValidEventDto(updateEvent);
        expect(isValid).toBe(false);
      }
    });
    
    it('should validate appeal from rejected status', async () => {
      // Create a claim data object with REJECTED status
      const rejectedClaim = createClaimData(ClaimType.MEDICAL, ClaimStatus.REJECTED);
      
      // Create a claim update event with APPEALED status
      const updateEvent = {
        type: 'CLAIM_UPDATED',
        journey: 'plan',
        userId: rejectedClaim.claimId,
        data: {
          ...rejectedClaim,
          status: ClaimStatus.APPEALED,
          previousStatus: ClaimStatus.REJECTED,
          appealReason: 'Additional documentation provided'
        }
      };
      
      // Validate the event
      const isValid = await isValidEventDto(updateEvent);
      expect(isValid).toBe(true);
      
      // Appeal without reason should be invalid
      const invalidAppealEvent = {
        type: 'CLAIM_UPDATED',
        journey: 'plan',
        userId: rejectedClaim.claimId,
        data: {
          ...rejectedClaim,
          status: ClaimStatus.APPEALED,
          previousStatus: ClaimStatus.REJECTED
          // Missing appealReason
        }
      };
      
      const isValidWithoutReason = await isValidEventDto(invalidAppealEvent);
      expect(isValidWithoutReason).toBe(false);
    });
    
    it('should validate payment processing flow', async () => {
      // Create a claim data object with APPROVED status
      const approvedClaim = createClaimData(ClaimType.MEDICAL, ClaimStatus.APPROVED);
      
      // Create a claim update event with PAYMENT_PENDING status
      const pendingPaymentEvent = {
        type: 'CLAIM_UPDATED',
        journey: 'plan',
        userId: approvedClaim.claimId,
        data: {
          ...approvedClaim,
          status: ClaimStatus.PAYMENT_PENDING,
          previousStatus: ClaimStatus.APPROVED,
          paymentDetails: {
            method: 'BANK_TRANSFER',
            accountNumber: '****1234',
            scheduledDate: new Date().toISOString()
          }
        }
      };
      
      // Validate the event
      const isPendingValid = await isValidEventDto(pendingPaymentEvent);
      expect(isPendingValid).toBe(true);
      
      // Create a claim update event with PAYMENT_PROCESSED status
      const processedPaymentEvent = {
        type: 'CLAIM_UPDATED',
        journey: 'plan',
        userId: approvedClaim.claimId,
        data: {
          ...pendingPaymentEvent.data,
          status: ClaimStatus.PAYMENT_PROCESSED,
          previousStatus: ClaimStatus.PAYMENT_PENDING,
          paymentDetails: {
            ...pendingPaymentEvent.data.paymentDetails,
            transactionId: '1234567890',
            processedDate: new Date().toISOString()
          }
        }
      };
      
      // Validate the event
      const isProcessedValid = await isValidEventDto(processedPaymentEvent);
      expect(isProcessedValid).toBe(true);
      
      // Payment processed without transaction ID should be invalid
      const invalidProcessedEvent = {
        type: 'CLAIM_UPDATED',
        journey: 'plan',
        userId: approvedClaim.claimId,
        data: {
          ...pendingPaymentEvent.data,
          status: ClaimStatus.PAYMENT_PROCESSED,
          previousStatus: ClaimStatus.PAYMENT_PENDING,
          paymentDetails: {
            ...pendingPaymentEvent.data.paymentDetails,
            // Missing transactionId
            processedDate: new Date().toISOString()
          }
        }
      };
      
      const isInvalidProcessedValid = await isValidEventDto(invalidProcessedEvent);
      expect(isInvalidProcessedValid).toBe(false);
    });
  });
  
  describe('Gamification Integration', () => {
    it('should validate claim events with gamification metadata', async () => {
      // Create a claim submission event with gamification metadata
      const event = createClaimSubmittedEvent();
      
      // Add gamification metadata
      event.gamification = {
        points: 10,
        achievementProgress: {
          achievementId: 'claim-master',
          progress: 1,
          threshold: 5,
          completed: false
        }
      };
      
      // Validate the event
      const isValid = await isValidEventDto(event);
      expect(isValid).toBe(true);
    });
    
    it('should validate claim events with different point values based on claim type', async () => {
      // Points should vary based on claim type complexity
      const pointsByClaimType = {
        [ClaimType.MEDICAL]: 10,
        [ClaimType.DENTAL]: 8,
        [ClaimType.VISION]: 8,
        [ClaimType.PHARMACY]: 5,
        [ClaimType.LABORATORY]: 7,
        [ClaimType.IMAGING]: 7,
        [ClaimType.THERAPY]: 6
      };
      
      for (const [claimType, points] of Object.entries(pointsByClaimType)) {
        // Create a claim submission event
        const event = createClaimSubmittedEvent(claimType as ClaimType);
        
        // Add gamification metadata with points based on claim type
        event.gamification = {
          points,
          achievementProgress: {
            achievementId: 'claim-master',
            progress: 1,
            threshold: 5,
            completed: false
          }
        };
        
        // Validate the event
        const isValid = await isValidEventDto(event);
        expect(isValid).toBe(true);
      }
    });
    
    it('should validate claim events with achievement unlocked', async () => {
      // Create a claim submission event
      const event = createClaimSubmittedEvent();
      
      // Add gamification metadata with completed achievement
      event.gamification = {
        points: 10,
        achievementProgress: {
          achievementId: 'claim-master',
          progress: 5,
          threshold: 5,
          completed: true
        },
        achievementUnlocked: {
          achievementId: 'claim-master',
          tier: 'bronze',
          name: 'Mestre em Reembolsos',
          description: 'Submeta 5 solicitações de reembolso completas',
          unlockedAt: new Date().toISOString()
        }
      };
      
      // Validate the event
      const isValid = await isValidEventDto(event);
      expect(isValid).toBe(true);
    });
    
    it('should reject claim events with invalid gamification metadata', async () => {
      // Create a claim submission event
      const event = createClaimSubmittedEvent();
      
      // Add invalid gamification metadata (negative points)
      event.gamification = {
        points: -10,
        achievementProgress: {
          achievementId: 'claim-master',
          progress: 1,
          threshold: 5,
          completed: false
        }
      };
      
      // Validate the event
      const isValid = await isValidEventDto(event);
      expect(isValid).toBe(false);
      
      // Create another claim submission event
      const anotherEvent = createClaimSubmittedEvent();
      
      // Add invalid gamification metadata (progress > threshold)
      anotherEvent.gamification = {
        points: 10,
        achievementProgress: {
          achievementId: 'claim-master',
          progress: 6,
          threshold: 5,
          completed: false // Inconsistent state: progress > threshold but not completed
        }
      };
      
      // Validate the event
      const isValidAnother = await isValidEventDto(anotherEvent);
      expect(isValidAnother).toBe(false);
    });
    
    it('should validate claim events with bonus points for complete documentation', async () => {
      // Create a claim submission event with documentation
      const event = createClaimSubmittedEvent(ClaimType.MEDICAL, {
        documentIds: ['550e8400-e29b-41d4-a716-446655440000', '6ba7b810-9dad-11d1-80b4-00c04fd430c8']
      });
      
      // Add gamification metadata with bonus points
      event.gamification = {
        points: 15, // Base 10 + 5 bonus for complete documentation
        bonusPoints: 5,
        bonusReason: 'complete_documentation',
        achievementProgress: {
          achievementId: 'claim-master',
          progress: 1,
          threshold: 5,
          completed: false
        }
      };
      
      // Validate the event
      const isValid = await isValidEventDto(event);
      expect(isValid).toBe(true);
    });
  });
});