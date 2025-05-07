import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';

// Use path aliases instead of absolute paths
import { PrismaService } from '@app/database';
import { TransactionService } from '@app/database/transactions';
import { AppExceptionFilter } from '@app/shared/exceptions';
import { JwtAuthGuard } from '@app/auth/guards';

// Import from local service using path aliases
import { TelemedicineController } from '@app/care/telemedicine/telemedicine.controller';
import { TelemedicineService } from '@app/care/telemedicine/telemedicine.service';
import { CreateSessionDto } from '@app/care/telemedicine/dto/create-session.dto';

// Import interfaces from @austa/interfaces
import { 
  ITelemedicineSession, 
  IAppointment,
  IProvider,
  AppointmentStatus, 
  AppointmentType,
  TelemedicineSessionStatus
} from '@austa/interfaces/journey/care';

// Import error classes from error framework
import { 
  TelemedicineSessionNotFoundError,
  TelemedicineConnectionError,
  TelemedicineProviderOfflineError
} from '@app/errors/journey/care/telemedicine-errors';
import { AppointmentNotFoundError } from '@app/errors/journey/care/appointment-errors';

// Import test factories
import { 
  createAppointmentFixture,
  createProviderFixture,
  createSpecialtyFixture,
  createTelemedicineSessionFixture
} from '@app/database/test/fixtures/care';

describe('Telemedicine E2E Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let transactionService: TransactionService;
  
  // Mock user for authentication
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };
  
  beforeAll(async () => {
    // Create a testing module
    const moduleRef = await Test.createTestingModule({
      controllers: [TelemedicineController],
      providers: [
        TelemedicineService,
        PrismaService,
        TransactionService,
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true }) // Default to authenticated
    .compile();
    
    app = moduleRef.createNestApplication();
    prismaService = moduleRef.get<PrismaService>(PrismaService);
    transactionService = moduleRef.get<TransactionService>(TransactionService);
    
    // Apply global exception filter
    app.useGlobalFilters(new AppExceptionFilter());
    
    // Add user to request
    app.use((req, res, next) => {
      req.user = mockUser;
      next();
    });
    
    await app.init();
    
    // Seed the database with test data using transaction
    await seedDatabase();
  });
  
  afterAll(async () => {
    // Clean up database using transaction
    await cleanDatabase();
    
    // Close the application
    await app.close();
  });
  
  // Helper function to seed the database with necessary test data
  async function seedDatabase() {
    try {
      // Use transaction service for atomic test data creation with retry capability
      await transactionService.executeInTransaction(async (tx) => {
        // Create specialty using factory
        const specialty = await createSpecialtyFixture(tx, {
          id: 'test-specialty-id',
          name: 'Test Specialty',
        });
        
        // Create provider using factory
        const provider = await createProviderFixture(tx, {
          id: 'test-provider-id',
          name: 'Dr. Test Provider',
          specialtyId: specialty.id,
          active: true,
          telemedicineEnabled: true,
          languages: ['pt-BR', 'en-US'],
        });
        
        // Create appointment using factory
        await createAppointmentFixture(tx, {
          id: 'test-appointment-id',
          userId: mockUser.id,
          providerId: provider.id,
          dateTime: new Date(),
          status: AppointmentStatus.SCHEDULED,
          type: AppointmentType.TELEMEDICINE,
          reason: 'Test appointment',
          duration: 30, // 30 minutes
        });
      }, {
        // Configure transaction options for test environment
        isolationLevel: 'ReadCommitted',
        timeout: 5000, // 5 seconds timeout for test transactions
        retryOptions: {
          maxRetries: 3,
          retryDelay: 100, // 100ms initial delay with exponential backoff
        }
      });
    } catch (error) {
      console.error('Failed to seed test database:', error);
      throw error;
    }
  }
  
  // Helper function to clean the database after tests
  async function cleanDatabase() {
    try {
      // Use transaction service for atomic cleanup with retry capability
      await transactionService.executeInTransaction(async (tx) => {
        // Delete in reverse order of dependencies
        await tx.telemedicineSession.deleteMany({});
        await tx.appointment.deleteMany({});
        await tx.provider.deleteMany({});
        await tx.specialty.deleteMany({});
      }, {
        // Configure transaction options for test environment
        isolationLevel: 'ReadCommitted',
        timeout: 5000, // 5 seconds timeout for test transactions
        retryOptions: {
          maxRetries: 3,
          retryDelay: 100, // 100ms initial delay with exponential backoff
        }
      });
    } catch (error) {
      console.error('Failed to clean test database:', error);
      // Don't throw here to ensure app.close() is called
    }
  }
  
  describe('POST /telemedicine/session', () => {
    // Test IDs for tracing in logs
    let testId: string;
    
    beforeEach(() => {
      // Generate unique test ID for tracing
      testId = uuidv4();
    });
    
    it('should create a telemedicine session', async () => {
      // Create valid DTO for session creation
      const createSessionDto: CreateSessionDto = {
        appointmentId: 'test-appointment-id',
        providerId: 'test-provider-id',
        // Add optional parameters to test full functionality
        settings: {
          enableVideo: true,
          enableAudio: true,
          enableChat: true,
          recordSession: false,
        },
        metadata: {
          testId, // Include test ID for tracing
          userAgent: 'Jest Test Runner',
          deviceType: 'Test Environment',
        },
      };
      
      // Make the request
      const response = await request(app.getHttpServer())
        .post('/telemedicine/session')
        .send(createSessionDto)
        .expect(HttpStatus.CREATED);
      
      // Validate the response against ITelemedicineSession interface
      const session = response.body as ITelemedicineSession;
      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.appointmentId).toEqual(createSessionDto.appointmentId);
      expect(session.providerId).toEqual(createSessionDto.providerId);
      expect(session.status).toEqual(TelemedicineSessionStatus.CREATED);
      expect(session.settings).toEqual(createSessionDto.settings);
      expect(session.metadata).toMatchObject({
        testId,
        userAgent: 'Jest Test Runner',
      });
      expect(session.createdAt).toBeDefined();
      expect(session.updatedAt).toBeDefined();
      
      // Verify the session was actually created in the database
      await transactionService.executeInTransaction(async (tx) => {
        const savedSession = await tx.telemedicineSession.findUnique({
          where: { id: session.id },
          include: {
            appointment: true,
            provider: true,
          }
        });
        expect(savedSession).toBeDefined();
        expect(savedSession.status).toEqual(TelemedicineSessionStatus.CREATED);
        expect(savedSession.appointment).toBeDefined();
        expect(savedSession.appointment.id).toEqual(createSessionDto.appointmentId);
        expect(savedSession.provider).toBeDefined();
        expect(savedSession.provider.id).toEqual(createSessionDto.providerId);
      });
    });
    
    it('should return 404 if appointment not found', async () => {
      // Create DTO with non-existent appointment
      const createSessionDto: CreateSessionDto = {
        appointmentId: 'non-existent-appointment',
        providerId: 'test-provider-id',
        metadata: { testId },
      };
      
      // Make the request and expect a 404 response
      const response = await request(app.getHttpServer())
        .post('/telemedicine/session')
        .send(createSessionDto)
        .expect(HttpStatus.NOT_FOUND);
      
      // Verify error structure from error framework
      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('Appointment not found');
      expect(response.body.code).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.path).toEqual('/telemedicine/session');
      
      // Verify specific error code from our error framework
      expect(response.body.code).toEqual('CARE-TELEMEDICINE-404');
      expect(response.body.type).toEqual('BUSINESS');
    });
    
    it('should return 400 if provider ID is missing', async () => {
      // Create DTO with missing provider ID
      const createSessionDto = {
        appointmentId: 'test-appointment-id',
        // providerId intentionally omitted
        metadata: { testId },
      };
      
      // Make the request and expect a 400 response
      const response = await request(app.getHttpServer())
        .post('/telemedicine/session')
        .send(createSessionDto)
        .expect(HttpStatus.BAD_REQUEST);
      
      // Verify validation error structure
      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('providerId');
      expect(response.body.code).toEqual('CARE-TELEMEDICINE-400');
    });
    
    it('should return 401 if not authenticated', async () => {
      // Create a separate testing module for unauthenticated test
      const unauthModuleRef = await Test.createTestingModule({
        controllers: [TelemedicineController],
        providers: [
          TelemedicineService,
          PrismaService,
          TransactionService,
        ],
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => false }) // Set to unauthenticated
      .compile();
      
      const unauthApp = unauthModuleRef.createNestApplication();
      unauthApp.useGlobalFilters(new AppExceptionFilter());
      await unauthApp.init();
      
      try {
        // Create valid DTO for session creation
        const createSessionDto: CreateSessionDto = {
          appointmentId: 'test-appointment-id',
          providerId: 'test-provider-id',
          metadata: { testId },
        };
        
        // Make the request to the unauthenticated app instance
        const response = await request(unauthApp.getHttpServer())
          .post('/telemedicine/session')
          .send(createSessionDto)
          .expect(HttpStatus.UNAUTHORIZED);
        
        // Verify error structure from auth error framework
        expect(response.body.error).toBeDefined();
        expect(response.body.message).toContain('Unauthorized');
        expect(response.body.code).toEqual('AUTH-401');
        expect(response.body.timestamp).toBeDefined();
      } finally {
        // Close the unauthenticated app instance
        await unauthApp.close();
      }
    });
    
    it('should handle concurrent session creation requests', async () => {
      // Create multiple session creation requests for the same appointment
      const createSessionDto: CreateSessionDto = {
        appointmentId: 'test-appointment-id',
        providerId: 'test-provider-id',
        metadata: { testId, concurrencyTest: true },
      };
      
      // Execute 3 concurrent requests
      const requests = [
        request(app.getHttpServer()).post('/telemedicine/session').send(createSessionDto),
        request(app.getHttpServer()).post('/telemedicine/session').send(createSessionDto),
        request(app.getHttpServer()).post('/telemedicine/session').send(createSessionDto),
      ];
      
      // Wait for all requests to complete
      const responses = await Promise.all(requests);
      
      // Verify that only one request succeeded with 201 Created
      const successResponses = responses.filter(res => res.status === HttpStatus.CREATED);
      expect(successResponses.length).toEqual(1);
      
      // Verify that the other requests failed with 409 Conflict
      const conflictResponses = responses.filter(res => res.status === HttpStatus.CONFLICT);
      expect(conflictResponses.length).toEqual(2);
      
      // Verify the conflict error structure
      for (const response of conflictResponses) {
        expect(response.body.error).toBeDefined();
        expect(response.body.message).toContain('already exists');
        expect(response.body.code).toEqual('CARE-TELEMEDICINE-409');
      }
    });
  });
});