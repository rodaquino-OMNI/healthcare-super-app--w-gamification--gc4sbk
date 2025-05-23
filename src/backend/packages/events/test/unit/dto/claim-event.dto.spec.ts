/**
 * @file claim-event.dto.spec.ts
 * @description Unit tests for the ClaimEventDto class and its subclasses.
 * 
 * These tests validate the behavior of the claim event DTOs, ensuring proper validation
 * of claim submission, approval, rejection, status updates, and document uploads.
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { 
  ClaimEventDto,
  ClaimSubmittedEventDto,
  ClaimApprovedEventDto,
  ClaimDeniedEventDto,
  ClaimDocumentUploadedEventDto,
  ClaimStatusUpdatedEventDto,
  ClaimCompletedEventDto,
  ClaimAmountDto,
  ClaimDocumentDto
} from '../../../src/dto/claim-event.dto';
import { ClaimStatus } from '@austa/interfaces/journey/plan';
import { EventType } from '@austa/interfaces/gamification/events';

describe('ClaimEventDto', () => {
  describe('Base ClaimEventDto', () => {
    it('should validate a valid claim event', async () => {
      const claimEvent = plainToInstance(ClaimEventDto, {
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.SUBMITTED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString()
      });

      const errors = await validate(claimEvent);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with missing required fields', async () => {
      const claimEvent = plainToInstance(ClaimEventDto, {});

      const errors = await validate(claimEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const errorFields = errors.map(error => error.property);
      expect(errorFields).toContain('claimId');
      expect(errorFields).toContain('claimType');
      expect(errorFields).toContain('status');
      expect(errorFields).toContain('planId');
    });

    it('should fail validation with invalid UUID format', async () => {
      const claimEvent = plainToInstance(ClaimEventDto, {
        claimId: 'invalid-uuid',
        claimType: 'medical_visit',
        status: ClaimStatus.SUBMITTED,
        planId: 'invalid-uuid',
        timestamp: new Date().toISOString()
      });

      const errors = await validate(claimEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const errorProperties = errors.map(error => error.property);
      expect(errorProperties).toContain('claimId');
      expect(errorProperties).toContain('planId');
    });

    it('should fail validation with invalid claim status', async () => {
      const claimEvent = plainToInstance(ClaimEventDto, {
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: 'INVALID_STATUS',
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString()
      });

      const errors = await validate(claimEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const statusError = errors.find(error => error.property === 'status');
      expect(statusError).toBeDefined();
    });

    it('should fail validation with invalid timestamp format', async () => {
      const claimEvent = plainToInstance(ClaimEventDto, {
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.SUBMITTED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: 'invalid-date'
      });

      const errors = await validate(claimEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const timestampError = errors.find(error => error.property === 'timestamp');
      expect(timestampError).toBeDefined();
    });
  });

  describe('ClaimAmountDto', () => {
    it('should validate a valid claim amount', async () => {
      const claimAmount = plainToInstance(ClaimAmountDto, {
        amount: 150.75,
        currency: 'BRL',
        covered: true,
        coveragePercentage: 80
      });

      const errors = await validate(claimAmount);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with negative amount', async () => {
      const claimAmount = plainToInstance(ClaimAmountDto, {
        amount: -50,
        currency: 'BRL'
      });

      const errors = await validate(claimAmount);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const amountError = errors.find(error => error.property === 'amount');
      expect(amountError).toBeDefined();
    });

    it('should fail validation with amount exceeding maximum', async () => {
      const claimAmount = plainToInstance(ClaimAmountDto, {
        amount: 2000000, // Exceeds the 1,000,000 maximum
        currency: 'BRL'
      });

      const errors = await validate(claimAmount);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const amountError = errors.find(error => error.property === 'amount');
      expect(amountError).toBeDefined();
    });

    it('should fail validation with invalid coverage percentage', async () => {
      const claimAmount = plainToInstance(ClaimAmountDto, {
        amount: 150.75,
        currency: 'BRL',
        covered: true,
        coveragePercentage: 120 // Exceeds 100%
      });

      const errors = await validate(claimAmount);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const coverageError = errors.find(error => error.property === 'coveragePercentage');
      expect(coverageError).toBeDefined();
    });

    it('should fail validation with negative coverage percentage', async () => {
      const claimAmount = plainToInstance(ClaimAmountDto, {
        amount: 150.75,
        currency: 'BRL',
        covered: true,
        coveragePercentage: -10 // Negative percentage
      });

      const errors = await validate(claimAmount);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const coverageError = errors.find(error => error.property === 'coveragePercentage');
      expect(coverageError).toBeDefined();
    });
  });

  describe('ClaimDocumentDto', () => {
    it('should validate a valid claim document', async () => {
      const claimDocument = plainToInstance(ClaimDocumentDto, {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'receipt',
        url: 'https://storage.austa.com/documents/123e4567-e89b-12d3-a456-426614174000.pdf',
        metadata: { fileSize: '1.2MB', contentType: 'application/pdf' }
      });

      const errors = await validate(claimDocument);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with missing required fields', async () => {
      const claimDocument = plainToInstance(ClaimDocumentDto, {});

      const errors = await validate(claimDocument);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const errorFields = errors.map(error => error.property);
      expect(errorFields).toContain('id');
      expect(errorFields).toContain('type');
    });

    it('should fail validation with invalid UUID format', async () => {
      const claimDocument = plainToInstance(ClaimDocumentDto, {
        id: 'invalid-uuid',
        type: 'receipt',
        url: 'https://storage.austa.com/documents/123e4567-e89b-12d3-a456-426614174000.pdf'
      });

      const errors = await validate(claimDocument);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const idError = errors.find(error => error.property === 'id');
      expect(idError).toBeDefined();
    });

    it('should fail validation with document type exceeding maximum length', async () => {
      const claimDocument = plainToInstance(ClaimDocumentDto, {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'a'.repeat(51), // Exceeds 50 character limit
        url: 'https://storage.austa.com/documents/123e4567-e89b-12d3-a456-426614174000.pdf'
      });

      const errors = await validate(claimDocument);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const typeError = errors.find(error => error.property === 'type');
      expect(typeError).toBeDefined();
    });
  });

  describe('ClaimSubmittedEventDto', () => {
    it('should validate a valid claim submission event', async () => {
      const claimSubmittedEvent = plainToInstance(ClaimSubmittedEventDto, {
        eventType: EventType.CLAIM_SUBMITTED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.SUBMITTED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL',
          covered: true,
          coveragePercentage: 80
        },
        documents: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            type: 'receipt',
            url: 'https://storage.austa.com/documents/receipt.pdf'
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174003',
            type: 'prescription',
            url: 'https://storage.austa.com/documents/prescription.pdf'
          }
        ],
        procedureCode: 'A123.4',
        isFirstClaim: true
      });

      const errors = await validate(claimSubmittedEvent);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with missing amount information', async () => {
      const claimSubmittedEvent = plainToInstance(ClaimSubmittedEventDto, {
        eventType: EventType.CLAIM_SUBMITTED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.SUBMITTED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString()
        // Missing amount
      });

      const errors = await validate(claimSubmittedEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const amountError = errors.find(error => error.property === 'amount');
      expect(amountError).toBeDefined();
    });

    it('should fail validation with too many documents', async () => {
      // Create an array of 11 documents (exceeding the 10 document limit)
      const documents = Array(11).fill(null).map((_, index) => ({
        id: `123e4567-e89b-12d3-a456-42661417400${index}`,
        type: 'receipt',
        url: `https://storage.austa.com/documents/receipt-${index}.pdf`
      }));

      const claimSubmittedEvent = plainToInstance(ClaimSubmittedEventDto, {
        eventType: EventType.CLAIM_SUBMITTED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.SUBMITTED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        },
        documents
      });

      const errors = await validate(claimSubmittedEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const documentsError = errors.find(error => error.property === 'documents');
      expect(documentsError).toBeDefined();
    });

    it('should fail validation with invalid procedure code length', async () => {
      const claimSubmittedEvent = plainToInstance(ClaimSubmittedEventDto, {
        eventType: EventType.CLAIM_SUBMITTED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.SUBMITTED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        },
        procedureCode: 'A'.repeat(21) // Exceeds 20 character limit
      });

      const errors = await validate(claimSubmittedEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const procedureCodeError = errors.find(error => error.property === 'procedureCode');
      expect(procedureCodeError).toBeDefined();
    });
  });

  describe('ClaimApprovedEventDto', () => {
    it('should validate a valid claim approval event', async () => {
      const claimApprovedEvent = plainToInstance(ClaimApprovedEventDto, {
        eventType: EventType.CLAIM_APPROVED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.APPROVED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL',
          covered: true,
          coveragePercentage: 80
        },
        approvedAmount: 120.60,
        expectedPaymentDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        approvalNotes: 'Claim approved with partial coverage'
      });

      const errors = await validate(claimApprovedEvent);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with missing approved amount', async () => {
      const claimApprovedEvent = plainToInstance(ClaimApprovedEventDto, {
        eventType: EventType.CLAIM_APPROVED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.APPROVED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        }
        // Missing approvedAmount
      });

      const errors = await validate(claimApprovedEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const approvedAmountError = errors.find(error => error.property === 'approvedAmount');
      expect(approvedAmountError).toBeDefined();
    });

    it('should fail validation with negative approved amount', async () => {
      const claimApprovedEvent = plainToInstance(ClaimApprovedEventDto, {
        eventType: EventType.CLAIM_APPROVED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.APPROVED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        },
        approvedAmount: -50 // Negative amount
      });

      const errors = await validate(claimApprovedEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const approvedAmountError = errors.find(error => error.property === 'approvedAmount');
      expect(approvedAmountError).toBeDefined();
    });

    it('should fail validation with invalid expected payment date format', async () => {
      const claimApprovedEvent = plainToInstance(ClaimApprovedEventDto, {
        eventType: EventType.CLAIM_APPROVED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.APPROVED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        },
        approvedAmount: 120.60,
        expectedPaymentDate: 'invalid-date'
      });

      const errors = await validate(claimApprovedEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const dateError = errors.find(error => error.property === 'expectedPaymentDate');
      expect(dateError).toBeDefined();
    });

    it('should fail validation with approval notes exceeding maximum length', async () => {
      const claimApprovedEvent = plainToInstance(ClaimApprovedEventDto, {
        eventType: EventType.CLAIM_APPROVED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.APPROVED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        },
        approvedAmount: 120.60,
        approvalNotes: 'a'.repeat(501) // Exceeds 500 character limit
      });

      const errors = await validate(claimApprovedEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const notesError = errors.find(error => error.property === 'approvalNotes');
      expect(notesError).toBeDefined();
    });
  });

  describe('ClaimDeniedEventDto', () => {
    it('should validate a valid claim denial event', async () => {
      const claimDeniedEvent = plainToInstance(ClaimDeniedEventDto, {
        eventType: EventType.CLAIM_DENIED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.DENIED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        },
        denialReason: 'Service not covered under current plan',
        denialCode: 'NC001',
        appealable: true,
        appealDeadline: new Date(Date.now() + 30 * 86400000).toISOString() // 30 days from now
      });

      const errors = await validate(claimDeniedEvent);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with missing denial reason', async () => {
      const claimDeniedEvent = plainToInstance(ClaimDeniedEventDto, {
        eventType: EventType.CLAIM_DENIED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.DENIED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        }
        // Missing denialReason
      });

      const errors = await validate(claimDeniedEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const reasonError = errors.find(error => error.property === 'denialReason');
      expect(reasonError).toBeDefined();
    });

    it('should fail validation with denial reason exceeding maximum length', async () => {
      const claimDeniedEvent = plainToInstance(ClaimDeniedEventDto, {
        eventType: EventType.CLAIM_DENIED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.DENIED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        },
        denialReason: 'a'.repeat(501) // Exceeds 500 character limit
      });

      const errors = await validate(claimDeniedEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const reasonError = errors.find(error => error.property === 'denialReason');
      expect(reasonError).toBeDefined();
    });

    it('should fail validation with denial code exceeding maximum length', async () => {
      const claimDeniedEvent = plainToInstance(ClaimDeniedEventDto, {
        eventType: EventType.CLAIM_DENIED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.DENIED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        },
        denialReason: 'Service not covered under current plan',
        denialCode: 'a'.repeat(21) // Exceeds 20 character limit
      });

      const errors = await validate(claimDeniedEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const codeError = errors.find(error => error.property === 'denialCode');
      expect(codeError).toBeDefined();
    });

    it('should fail validation with invalid appeal deadline format', async () => {
      const claimDeniedEvent = plainToInstance(ClaimDeniedEventDto, {
        eventType: EventType.CLAIM_DENIED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.DENIED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        },
        denialReason: 'Service not covered under current plan',
        appealable: true,
        appealDeadline: 'invalid-date'
      });

      const errors = await validate(claimDeniedEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const deadlineError = errors.find(error => error.property === 'appealDeadline');
      expect(deadlineError).toBeDefined();
    });
  });

  describe('ClaimDocumentUploadedEventDto', () => {
    it('should validate a valid document upload event', async () => {
      const documentUploadEvent = plainToInstance(ClaimDocumentUploadedEventDto, {
        eventType: EventType.CLAIM_DOCUMENT_UPLOADED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.ADDITIONAL_INFO_REQUIRED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        documents: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            type: 'receipt',
            url: 'https://storage.austa.com/documents/receipt.pdf'
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174003',
            type: 'prescription',
            url: 'https://storage.austa.com/documents/prescription.pdf'
          }
        ],
        documentCount: 5, // Total documents including these new ones
        documentationComplete: true
      });

      const errors = await validate(documentUploadEvent);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with missing documents array', async () => {
      const documentUploadEvent = plainToInstance(ClaimDocumentUploadedEventDto, {
        eventType: EventType.CLAIM_DOCUMENT_UPLOADED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.ADDITIONAL_INFO_REQUIRED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        documentCount: 5
        // Missing documents array
      });

      const errors = await validate(documentUploadEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const documentsError = errors.find(error => error.property === 'documents');
      expect(documentsError).toBeDefined();
    });

    it('should fail validation with empty documents array', async () => {
      const documentUploadEvent = plainToInstance(ClaimDocumentUploadedEventDto, {
        eventType: EventType.CLAIM_DOCUMENT_UPLOADED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.ADDITIONAL_INFO_REQUIRED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        documents: [], // Empty array
        documentCount: 5
      });

      const errors = await validate(documentUploadEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const documentsError = errors.find(error => error.property === 'documents');
      expect(documentsError).toBeDefined();
    });

    it('should fail validation with too many documents', async () => {
      // Create an array of 11 documents (exceeding the 10 document limit)
      const documents = Array(11).fill(null).map((_, index) => ({
        id: `123e4567-e89b-12d3-a456-42661417400${index}`,
        type: 'receipt',
        url: `https://storage.austa.com/documents/receipt-${index}.pdf`
      }));

      const documentUploadEvent = plainToInstance(ClaimDocumentUploadedEventDto, {
        eventType: EventType.CLAIM_DOCUMENT_UPLOADED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.ADDITIONAL_INFO_REQUIRED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        documents,
        documentCount: 15
      });

      const errors = await validate(documentUploadEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const documentsError = errors.find(error => error.property === 'documents');
      expect(documentsError).toBeDefined();
    });

    it('should fail validation with invalid document count', async () => {
      const documentUploadEvent = plainToInstance(ClaimDocumentUploadedEventDto, {
        eventType: EventType.CLAIM_DOCUMENT_UPLOADED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.ADDITIONAL_INFO_REQUIRED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        documents: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            type: 'receipt',
            url: 'https://storage.austa.com/documents/receipt.pdf'
          }
        ],
        documentCount: 0 // Invalid count (must be at least 1)
      });

      const errors = await validate(documentUploadEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const countError = errors.find(error => error.property === 'documentCount');
      expect(countError).toBeDefined();
    });
  });

  describe('ClaimStatusUpdatedEventDto', () => {
    it('should validate a valid status update event', async () => {
      const statusUpdateEvent = plainToInstance(ClaimStatusUpdatedEventDto, {
        eventType: 'CLAIM_STATUS_UPDATED',
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.UNDER_REVIEW,
        previousStatus: ClaimStatus.SUBMITTED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        statusChangeReason: 'Claim has been assigned to a reviewer',
        changedByUserId: '123e4567-e89b-12d3-a456-426614174004',
        requiresAction: false
      });

      const errors = await validate(statusUpdateEvent);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with missing previous status', async () => {
      const statusUpdateEvent = plainToInstance(ClaimStatusUpdatedEventDto, {
        eventType: 'CLAIM_STATUS_UPDATED',
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.UNDER_REVIEW,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString()
        // Missing previousStatus
      });

      const errors = await validate(statusUpdateEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const previousStatusError = errors.find(error => error.property === 'previousStatus');
      expect(previousStatusError).toBeDefined();
    });

    it('should fail validation with invalid previous status', async () => {
      const statusUpdateEvent = plainToInstance(ClaimStatusUpdatedEventDto, {
        eventType: 'CLAIM_STATUS_UPDATED',
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.UNDER_REVIEW,
        previousStatus: 'INVALID_STATUS',
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString()
      });

      const errors = await validate(statusUpdateEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const previousStatusError = errors.find(error => error.property === 'previousStatus');
      expect(previousStatusError).toBeDefined();
    });

    it('should fail validation with status change reason exceeding maximum length', async () => {
      const statusUpdateEvent = plainToInstance(ClaimStatusUpdatedEventDto, {
        eventType: 'CLAIM_STATUS_UPDATED',
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.UNDER_REVIEW,
        previousStatus: ClaimStatus.SUBMITTED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        statusChangeReason: 'a'.repeat(501) // Exceeds 500 character limit
      });

      const errors = await validate(statusUpdateEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const reasonError = errors.find(error => error.property === 'statusChangeReason');
      expect(reasonError).toBeDefined();
    });

    it('should fail validation with invalid changedByUserId format', async () => {
      const statusUpdateEvent = plainToInstance(ClaimStatusUpdatedEventDto, {
        eventType: 'CLAIM_STATUS_UPDATED',
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.UNDER_REVIEW,
        previousStatus: ClaimStatus.SUBMITTED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        changedByUserId: 'invalid-uuid'
      });

      const errors = await validate(statusUpdateEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const userIdError = errors.find(error => error.property === 'changedByUserId');
      expect(userIdError).toBeDefined();
    });
  });

  describe('ClaimCompletedEventDto', () => {
    it('should validate a valid claim completion event', async () => {
      const claimCompletedEvent = plainToInstance(ClaimCompletedEventDto, {
        eventType: EventType.CLAIM_COMPLETED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.COMPLETED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL',
          covered: true,
          coveragePercentage: 80
        },
        finalAmount: 120.60,
        paymentReference: 'PAY-123456',
        paymentDate: new Date().toISOString(),
        processingTimeDays: 5
      });

      const errors = await validate(claimCompletedEvent);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with missing final amount', async () => {
      const claimCompletedEvent = plainToInstance(ClaimCompletedEventDto, {
        eventType: EventType.CLAIM_COMPLETED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.COMPLETED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        }
        // Missing finalAmount
      });

      const errors = await validate(claimCompletedEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const finalAmountError = errors.find(error => error.property === 'finalAmount');
      expect(finalAmountError).toBeDefined();
    });

    it('should fail validation with negative final amount', async () => {
      const claimCompletedEvent = plainToInstance(ClaimCompletedEventDto, {
        eventType: EventType.CLAIM_COMPLETED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.COMPLETED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        },
        finalAmount: -50 // Negative amount
      });

      const errors = await validate(claimCompletedEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const finalAmountError = errors.find(error => error.property === 'finalAmount');
      expect(finalAmountError).toBeDefined();
    });

    it('should fail validation with payment reference exceeding maximum length', async () => {
      const claimCompletedEvent = plainToInstance(ClaimCompletedEventDto, {
        eventType: EventType.CLAIM_COMPLETED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.COMPLETED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        },
        finalAmount: 120.60,
        paymentReference: 'a'.repeat(51) // Exceeds 50 character limit
      });

      const errors = await validate(claimCompletedEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const referenceError = errors.find(error => error.property === 'paymentReference');
      expect(referenceError).toBeDefined();
    });

    it('should fail validation with invalid payment date format', async () => {
      const claimCompletedEvent = plainToInstance(ClaimCompletedEventDto, {
        eventType: EventType.CLAIM_COMPLETED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.COMPLETED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        },
        finalAmount: 120.60,
        paymentDate: 'invalid-date'
      });

      const errors = await validate(claimCompletedEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const dateError = errors.find(error => error.property === 'paymentDate');
      expect(dateError).toBeDefined();
    });

    it('should fail validation with negative processing time', async () => {
      const claimCompletedEvent = plainToInstance(ClaimCompletedEventDto, {
        eventType: EventType.CLAIM_COMPLETED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.COMPLETED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        },
        finalAmount: 120.60,
        processingTimeDays: -2 // Negative processing time
      });

      const errors = await validate(claimCompletedEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const timeError = errors.find(error => error.property === 'processingTimeDays');
      expect(timeError).toBeDefined();
    });
  });

  // Integration tests for claim state transitions
  describe('Claim State Transitions', () => {
    it('should validate a complete claim lifecycle', async () => {
      // 1. Claim Submission
      const claimSubmittedEvent = plainToInstance(ClaimSubmittedEventDto, {
        eventType: EventType.CLAIM_SUBMITTED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.SUBMITTED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        },
        isFirstClaim: true
      });

      let errors = await validate(claimSubmittedEvent);
      expect(errors.length).toBe(0);

      // 2. Status Update to UNDER_REVIEW
      const statusUpdateEvent = plainToInstance(ClaimStatusUpdatedEventDto, {
        eventType: 'CLAIM_STATUS_UPDATED',
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.UNDER_REVIEW,
        previousStatus: ClaimStatus.SUBMITTED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString()
      });

      errors = await validate(statusUpdateEvent);
      expect(errors.length).toBe(0);

      // 3. Document Upload
      const documentUploadEvent = plainToInstance(ClaimDocumentUploadedEventDto, {
        eventType: EventType.CLAIM_DOCUMENT_UPLOADED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.UNDER_REVIEW,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        documents: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            type: 'receipt',
            url: 'https://storage.austa.com/documents/receipt.pdf'
          }
        ],
        documentCount: 1
      });

      errors = await validate(documentUploadEvent);
      expect(errors.length).toBe(0);

      // 4. Claim Approval
      const claimApprovedEvent = plainToInstance(ClaimApprovedEventDto, {
        eventType: EventType.CLAIM_APPROVED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.APPROVED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        },
        approvedAmount: 120.60
      });

      errors = await validate(claimApprovedEvent);
      expect(errors.length).toBe(0);

      // 5. Claim Completion
      const claimCompletedEvent = plainToInstance(ClaimCompletedEventDto, {
        eventType: EventType.CLAIM_COMPLETED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.COMPLETED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        },
        finalAmount: 120.60,
        processingTimeDays: 5
      });

      errors = await validate(claimCompletedEvent);
      expect(errors.length).toBe(0);
    });

    it('should validate a denied claim lifecycle', async () => {
      // 1. Claim Submission
      const claimSubmittedEvent = plainToInstance(ClaimSubmittedEventDto, {
        eventType: EventType.CLAIM_SUBMITTED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.SUBMITTED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        }
      });

      let errors = await validate(claimSubmittedEvent);
      expect(errors.length).toBe(0);

      // 2. Status Update to UNDER_REVIEW
      const statusUpdateEvent = plainToInstance(ClaimStatusUpdatedEventDto, {
        eventType: 'CLAIM_STATUS_UPDATED',
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.UNDER_REVIEW,
        previousStatus: ClaimStatus.SUBMITTED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString()
      });

      errors = await validate(statusUpdateEvent);
      expect(errors.length).toBe(0);

      // 3. Claim Denial
      const claimDeniedEvent = plainToInstance(ClaimDeniedEventDto, {
        eventType: EventType.CLAIM_DENIED,
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.DENIED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        amount: {
          amount: 150.75,
          currency: 'BRL'
        },
        denialReason: 'Service not covered under current plan',
        appealable: true
      });

      errors = await validate(claimDeniedEvent);
      expect(errors.length).toBe(0);

      // 4. Status Update to APPEALED
      const appealStatusEvent = plainToInstance(ClaimStatusUpdatedEventDto, {
        eventType: 'CLAIM_STATUS_UPDATED',
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.APPEALED,
        previousStatus: ClaimStatus.DENIED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        statusChangeReason: 'Customer has appealed the denial'
      });

      errors = await validate(appealStatusEvent);
      expect(errors.length).toBe(0);

      // 5. Final Denial
      const finalDenialEvent = plainToInstance(ClaimStatusUpdatedEventDto, {
        eventType: 'CLAIM_STATUS_UPDATED',
        claimId: '123e4567-e89b-12d3-a456-426614174000',
        claimType: 'medical_visit',
        status: ClaimStatus.FINAL_DENIAL,
        previousStatus: ClaimStatus.APPEALED,
        planId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        statusChangeReason: 'Appeal reviewed and denied'
      });

      errors = await validate(finalDenialEvent);
      expect(errors.length).toBe(0);
    });
  });
});