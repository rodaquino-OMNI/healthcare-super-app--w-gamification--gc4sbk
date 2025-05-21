import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as request from 'supertest';

// Updated imports using path aliases
import { PrismaService } from '@app/shared/database/prisma.service';
import { AppExceptionFilter } from '@app/shared/exceptions/exceptions.filter';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { TelemedicineController } from '@app/care/telemedicine/telemedicine.controller';
import { TelemedicineService } from '@app/care/telemedicine/telemedicine.service';
import { CreateSessionDto } from '@app/care/telemedicine/dto/create-session.dto';

// Import interfaces from @austa/interfaces
import { ITelemedicineSession, IAppointment } from '@austa/interfaces/journey/care';

// Import transaction management
import { TransactionService } from '@app/database/transactions';

// Import test factories
import { 
  createAppointmentFixture,
  createProviderFixture,
  createSpecialtyFixture
} from '@app/database/test/fixtures/care';

// Import specialized error classes
import { TelemedicineSessionNotFoundError } from '@austa/errors/journey/care';

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
    // Use transaction for test data setup
    await transactionService.executeInTransaction(async (tx) => {
      // Seed specialty using test factory
      const specialty = await createSpecialtyFixture(tx, {
        id: 'test-specialty-id',
        name: 'Test Specialty',
      });
      
      // Seed provider using test factory
      const provider = await createProviderFixture(tx, {
        id: 'test-provider-id',
        name: 'Dr. Test Provider',
        specialtyId: specialty.id,
        active: true,
      });
      
      // Seed appointment using test factory
      await createAppointmentFixture(tx, {
        id: 'test-appointment-id',
        userId: mockUser.id,
        providerId: provider.id,
        dateTime: new Date(),
        status: 'SCHEDULED',
        type: 'TELEMEDICINE',
        reason: 'Test appointment',
      });
    });
  }
  
  // Helper function to clean the database after tests
  async function cleanDatabase() {
    // Use transaction for test data cleanup
    await transactionService.executeInTransaction(async (tx) => {
      await tx.telemedicineSession.deleteMany({});
      await tx.appointment.deleteMany({});
      await tx.provider.deleteMany({});
      await tx.specialty.deleteMany({});
    });
  }
  
  describe('POST /telemedicine/session', () => {
    it('should create a telemedicine session', async () => {
      // Create valid DTO for session creation
      const createSessionDto: CreateSessionDto = {
        appointmentId: 'test-appointment-id',
        providerId: 'test-provider-id',
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
      expect(session.status).toEqual('CREATED');
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
        };
        
        // Make the request to the unauthenticated app instance
        await request(unauthApp.getHttpServer())
          .post('/telemedicine/session')
          .send(createSessionDto)
          .expect(HttpStatus.UNAUTHORIZED);
      } finally {
        // Close the unauthenticated app instance
        await unauthApp.close();
      }
    });
    
    it('should handle invalid appointment ID correctly', async () => {
      // Create DTO with invalid appointment ID
      const createSessionDto: CreateSessionDto = {
        appointmentId: 'non-existent-appointment',
        providerId: 'test-provider-id',
      };
      
      // Make the request and expect a 404 Not Found response
      const response = await request(app.getHttpServer())
        .post('/telemedicine/session')
        .send(createSessionDto)
        .expect(HttpStatus.NOT_FOUND);
      
      // Verify error structure from the error framework
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('appointment');
    });
  });
});