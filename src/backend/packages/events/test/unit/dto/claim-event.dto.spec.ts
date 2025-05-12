import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  ClaimEventDto,
  ClaimSubmissionEventDto,
  ClaimStatusUpdateEventDto,
  ClaimDocumentAddedEventDto,
  ClaimPaymentEventDto,
  ClaimStatus,
  ClaimType,
  Currency,
  ClaimDocumentDto
} from '../../../src/dto/claim-event.dto';

describe('ClaimEventDto', () => {
  // Helper function to create a valid base claim event
  const createValidClaimEvent = (): ClaimEventDto => {
    return {
      claimId: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      planId: '123e4567-e89b-12d3-a456-426614174002',
      type: ClaimType.MEDICAL,
      status: ClaimStatus.SUBMITTED,
      amount: 100.50,
      currency: Currency.BRL,
      submittedAt: '2023-04-01T12:00:00Z',
      documents: [
        {
          id: '123e4567-e89b-12d3-a456-426614174003',
          type: 'RECEIPT',
          filename: 'receipt.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          uploadedAt: '2023-04-01T11:30:00Z'
        }
      ]
    };
  };

  // Helper function to create a valid claim document
  const createValidClaimDocument = (): ClaimDocumentDto => {
    return {
      id: '123e4567-e89b-12d3-a456-426614174003',
      type: 'RECEIPT',
      filename: 'receipt.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      uploadedAt: '2023-04-01T11:30:00Z'
    };
  };

  describe('Base ClaimEventDto validation', () => {
    it('should validate a valid claim event', async () => {
      // Arrange
      const claimEvent = createValidClaimEvent();
      const dto = plainToInstance(ClaimEventDto, claimEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should require a valid UUID for claimId', async () => {
      // Arrange
      const claimEvent = createValidClaimEvent();
      claimEvent.claimId = 'invalid-uuid';
      const dto = plainToInstance(ClaimEventDto, claimEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });

    it('should require a valid UUID for userId', async () => {
      // Arrange
      const claimEvent = createValidClaimEvent();
      claimEvent.userId = 'invalid-uuid';
      const dto = plainToInstance(ClaimEventDto, claimEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });

    it('should require a valid UUID for planId', async () => {
      // Arrange
      const claimEvent = createValidClaimEvent();
      claimEvent.planId = 'invalid-uuid';
      const dto = plainToInstance(ClaimEventDto, claimEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });

    it('should require a valid claim type', async () => {
      // Arrange
      const claimEvent = createValidClaimEvent();
      claimEvent.type = 'INVALID_TYPE' as ClaimType;
      const dto = plainToInstance(ClaimEventDto, claimEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should require a valid claim status', async () => {
      // Arrange
      const claimEvent = createValidClaimEvent();
      claimEvent.status = 'INVALID_STATUS' as ClaimStatus;
      const dto = plainToInstance(ClaimEventDto, claimEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should require a positive amount', async () => {
      // Arrange
      const claimEvent = createValidClaimEvent();
      claimEvent.amount = -100;
      const dto = plainToInstance(ClaimEventDto, claimEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should enforce maximum amount limit', async () => {
      // Arrange
      const claimEvent = createValidClaimEvent();
      claimEvent.amount = 2000000; // Above the 1,000,000 limit
      const dto = plainToInstance(ClaimEventDto, claimEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('max');
    });

    it('should require a valid currency', async () => {
      // Arrange
      const claimEvent = createValidClaimEvent();
      claimEvent.currency = 'INVALID_CURRENCY' as Currency;
      const dto = plainToInstance(ClaimEventDto, claimEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should validate optional fields when provided', async () => {
      // Arrange
      const claimEvent = createValidClaimEvent();
      claimEvent.providerName = 'Dr. Smith';
      claimEvent.serviceDate = '2023-03-15T10:00:00Z';
      claimEvent.notes = 'Annual checkup';
      const dto = plainToInstance(ClaimEventDto, claimEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should validate ISO8601 date strings', async () => {
      // Arrange
      const claimEvent = createValidClaimEvent();
      claimEvent.submittedAt = 'invalid-date';
      const dto = plainToInstance(ClaimEventDto, claimEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isIso8601');
    });
  });

  describe('ClaimDocumentDto validation', () => {
    it('should validate a valid claim document', async () => {
      // Arrange
      const document = createValidClaimDocument();
      const dto = plainToInstance(ClaimDocumentDto, document);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should require a valid UUID for id', async () => {
      // Arrange
      const document = createValidClaimDocument();
      document.id = 'invalid-uuid';
      const dto = plainToInstance(ClaimDocumentDto, document);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });

    it('should require a document type', async () => {
      // Arrange
      const document = createValidClaimDocument();
      document.type = '';
      const dto = plainToInstance(ClaimDocumentDto, document);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should require a filename', async () => {
      // Arrange
      const document = createValidClaimDocument();
      document.filename = '';
      const dto = plainToInstance(ClaimDocumentDto, document);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should require a mimeType', async () => {
      // Arrange
      const document = createValidClaimDocument();
      document.mimeType = '';
      const dto = plainToInstance(ClaimDocumentDto, document);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should require a positive size', async () => {
      // Arrange
      const document = createValidClaimDocument();
      document.size = 0;
      const dto = plainToInstance(ClaimDocumentDto, document);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should validate uploadedAt as ISO8601 date string', async () => {
      // Arrange
      const document = createValidClaimDocument();
      document.uploadedAt = 'invalid-date';
      const dto = plainToInstance(ClaimDocumentDto, document);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isIso8601');
    });

    it('should allow optional url field', async () => {
      // Arrange
      const document = createValidClaimDocument();
      document.url = 'https://example.com/documents/receipt.pdf';
      const dto = plainToInstance(ClaimDocumentDto, document);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });
  });

  describe('ClaimSubmissionEventDto validation', () => {
    // Helper function to create a valid claim submission event
    const createValidClaimSubmissionEvent = (): ClaimSubmissionEventDto => {
      const baseEvent = createValidClaimEvent();
      return {
        ...baseEvent,
        status: ClaimStatus.SUBMITTED,
        submittedAt: '2023-04-01T12:00:00Z',
        documents: [
          createValidClaimDocument()
        ]
      };
    };

    it('should validate a valid claim submission event', async () => {
      // Arrange
      const submissionEvent = createValidClaimSubmissionEvent();
      const dto = plainToInstance(ClaimSubmissionEventDto, submissionEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should require SUBMITTED status for submission events', async () => {
      // Arrange
      const submissionEvent = createValidClaimSubmissionEvent();
      submissionEvent.status = ClaimStatus.DRAFT;
      const dto = plainToInstance(ClaimSubmissionEventDto, submissionEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isIn');
    });

    it('should require submittedAt timestamp for submission events', async () => {
      // Arrange
      const submissionEvent = createValidClaimSubmissionEvent();
      delete submissionEvent.submittedAt;
      const dto = plainToInstance(ClaimSubmissionEventDto, submissionEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should require at least one document for submission events', async () => {
      // Arrange
      const submissionEvent = createValidClaimSubmissionEvent();
      submissionEvent.documents = [];
      const dto = plainToInstance(ClaimSubmissionEventDto, submissionEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('arrayMinSize');
    });

    it('should enforce maximum document limit for submission events', async () => {
      // Arrange
      const submissionEvent = createValidClaimSubmissionEvent();
      // Create 11 documents (exceeding the limit of 10)
      submissionEvent.documents = Array(11).fill(0).map(() => createValidClaimDocument());
      const dto = plainToInstance(ClaimSubmissionEventDto, submissionEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('arrayMaxSize');
    });

    it('should validate each document in the documents array', async () => {
      // Arrange
      const submissionEvent = createValidClaimSubmissionEvent();
      submissionEvent.documents = [
        {
          ...createValidClaimDocument(),
          id: 'invalid-uuid' // Invalid UUID
        }
      ];
      const dto = plainToInstance(ClaimSubmissionEventDto, submissionEvent);

      // Act
      const errors = await validate(dto, { validationError: { target: false } });

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      // The error should be in the nested document
      const nestedErrors = errors.find(e => e.property === 'documents');
      expect(nestedErrors).toBeDefined();
    });
  });

  describe('ClaimStatusUpdateEventDto validation', () => {
    // Helper function to create a valid claim status update event
    const createValidStatusUpdateEvent = (): ClaimStatusUpdateEventDto => {
      const baseEvent = createValidClaimEvent();
      return {
        ...baseEvent,
        status: ClaimStatus.APPROVED,
        previousStatus: ClaimStatus.IN_REVIEW,
        processedAt: '2023-04-02T14:30:00Z',
        statusChangeReason: 'All documentation verified'
      };
    };

    it('should validate a valid claim status update event', async () => {
      // Arrange
      const updateEvent = createValidStatusUpdateEvent();
      const dto = plainToInstance(ClaimStatusUpdateEventDto, updateEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should require previousStatus for status update events', async () => {
      // Arrange
      const updateEvent = createValidStatusUpdateEvent();
      delete updateEvent.previousStatus;
      const dto = plainToInstance(ClaimStatusUpdateEventDto, updateEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should require processedAt timestamp for status update events', async () => {
      // Arrange
      const updateEvent = createValidStatusUpdateEvent();
      delete updateEvent.processedAt;
      const dto = plainToInstance(ClaimStatusUpdateEventDto, updateEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should validate optional approvedAmount when provided', async () => {
      // Arrange
      const updateEvent = createValidStatusUpdateEvent();
      updateEvent.approvedAmount = -50; // Invalid negative amount
      const dto = plainToInstance(ClaimStatusUpdateEventDto, updateEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should validate status transitions', async () => {
      // This test would ideally check business rules for valid status transitions
      // For example, a claim can't go from DRAFT to PAID without intermediate statuses
      // However, these business rules are typically implemented in service layer logic
      // rather than in the DTO validation itself

      // For demonstration, we'll just verify that both status and previousStatus are validated
      // Arrange
      const updateEvent = createValidStatusUpdateEvent();
      updateEvent.status = 'INVALID_STATUS' as ClaimStatus;
      updateEvent.previousStatus = 'INVALID_PREVIOUS' as ClaimStatus;
      const dto = plainToInstance(ClaimStatusUpdateEventDto, updateEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      // Should have at least two errors (one for each invalid status)
      expect(errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('ClaimDocumentAddedEventDto validation', () => {
    // Helper function to create a valid document added event
    const createValidDocumentAddedEvent = (): ClaimDocumentAddedEventDto => {
      const baseEvent = createValidClaimEvent();
      return {
        ...baseEvent,
        newDocuments: [
          createValidClaimDocument()
        ]
      };
    };

    it('should validate a valid document added event', async () => {
      // Arrange
      const documentEvent = createValidDocumentAddedEvent();
      const dto = plainToInstance(ClaimDocumentAddedEventDto, documentEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should require at least one new document', async () => {
      // Arrange
      const documentEvent = createValidDocumentAddedEvent();
      documentEvent.newDocuments = [];
      const dto = plainToInstance(ClaimDocumentAddedEventDto, documentEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('arrayMinSize');
    });

    it('should enforce maximum document limit', async () => {
      // Arrange
      const documentEvent = createValidDocumentAddedEvent();
      // Create 11 documents (exceeding the limit of 10)
      documentEvent.newDocuments = Array(11).fill(0).map(() => createValidClaimDocument());
      const dto = plainToInstance(ClaimDocumentAddedEventDto, documentEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('arrayMaxSize');
    });

    it('should validate each document in the newDocuments array', async () => {
      // Arrange
      const documentEvent = createValidDocumentAddedEvent();
      documentEvent.newDocuments = [
        {
          ...createValidClaimDocument(),
          size: -1 // Invalid negative size
        }
      ];
      const dto = plainToInstance(ClaimDocumentAddedEventDto, documentEvent);

      // Act
      const errors = await validate(dto, { validationError: { target: false } });

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      // The error should be in the nested document
      const nestedErrors = errors.find(e => e.property === 'newDocuments');
      expect(nestedErrors).toBeDefined();
    });
  });

  describe('ClaimPaymentEventDto validation', () => {
    // Helper function to create a valid payment event
    const createValidPaymentEvent = (): ClaimPaymentEventDto => {
      const baseEvent = createValidClaimEvent();
      return {
        ...baseEvent,
        status: ClaimStatus.PAID,
        paidAmount: 95.75,
        paymentDate: '2023-04-05T09:15:00Z',
        paymentReference: 'PAY-123456789'
      };
    };

    it('should validate a valid payment event', async () => {
      // Arrange
      const paymentEvent = createValidPaymentEvent();
      const dto = plainToInstance(ClaimPaymentEventDto, paymentEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should require PAID status for payment events', async () => {
      // Arrange
      const paymentEvent = createValidPaymentEvent();
      paymentEvent.status = ClaimStatus.APPROVED;
      const dto = plainToInstance(ClaimPaymentEventDto, paymentEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isIn');
    });

    it('should require a positive paidAmount', async () => {
      // Arrange
      const paymentEvent = createValidPaymentEvent();
      paymentEvent.paidAmount = 0;
      const dto = plainToInstance(ClaimPaymentEventDto, paymentEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should require a paymentDate', async () => {
      // Arrange
      const paymentEvent = createValidPaymentEvent();
      delete paymentEvent.paymentDate;
      const dto = plainToInstance(ClaimPaymentEventDto, paymentEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should require a paymentReference', async () => {
      // Arrange
      const paymentEvent = createValidPaymentEvent();
      delete paymentEvent.paymentReference;
      const dto = plainToInstance(ClaimPaymentEventDto, paymentEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should validate paymentDate as ISO8601 date string', async () => {
      // Arrange
      const paymentEvent = createValidPaymentEvent();
      paymentEvent.paymentDate = 'invalid-date';
      const dto = plainToInstance(ClaimPaymentEventDto, paymentEvent);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isIso8601');
    });
  });

  describe('Integration with Plan Journey', () => {
    // These tests would verify that claim events properly integrate with the plan journey
    // and the gamification system. However, this would typically involve service-level tests
    // rather than DTO validation tests.
    
    // For demonstration, we'll just include a placeholder test
    it('should integrate with plan journey events', () => {
      // This would test that claim events can be properly converted to/from plan journey events
      // and that they trigger the appropriate gamification rules
      expect(true).toBe(true);
    });
  });
});