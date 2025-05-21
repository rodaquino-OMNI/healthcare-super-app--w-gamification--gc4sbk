import { Test, TestingModule } from '@nestjs/testing'; // version 10.3.0
import { INestApplication, HttpStatus } from '@nestjs/common'; // version 10.3.0
import * as request from 'supertest'; // version 6.3.3
import { SuperAgentTest } from 'supertest'; // version 6.3.3
import { beforeEach, describe, expect, it, afterAll } from '@jest/globals'; // version 29.0.0+

// Import using path aliases instead of absolute paths
import { AppointmentsController } from '@app/care/appointments/appointments.controller';
import { AppointmentsService } from '@app/care/appointments/appointments.service';

// Import from @austa/interfaces for type-safe data models
import { AppointmentType } from '@austa/interfaces/journey/care';
import { CreateAppointmentDto } from '@austa/interfaces/journey/care';

// Import error codes from the centralized error framework
import { AUTH_INSUFFICIENT_PERMISSIONS } from '@austa/errors/journey/care/error-codes';

describe('AppointmentsController (e2e)', () => {
  let app: INestApplication;
  let agent: SuperAgentTest;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        {
          provide: AppointmentsService,
          useValue: {
            create: () => ({}),
            findAll: () => [],
            findOne: () => ({}),
            update: () => ({}),
            remove: () => ({}),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply global pipes and exception filters from the centralized error framework
    app.useGlobalFilters(app.get('APP_EXCEPTION_FILTER'));
    app.useGlobalPipes(app.get('APP_VALIDATION_PIPE'));
    
    await app.init();
    agent = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it('/appointments (POST) should return 201 if successful', () => {
    const createAppointmentDto: CreateAppointmentDto = {
      userId: 'valid-uuid',
      providerId: 'valid-uuid',
      dateTime: new Date(),
      type: AppointmentType.IN_PERSON, // Use enum from @austa/interfaces
    };

    return agent
      .post('/appointments')
      .send(createAppointmentDto)
      .expect(HttpStatus.CREATED);
  });

  it('/appointments (POST) should return 403 if insufficient permissions', () => {
    const createAppointmentDto: CreateAppointmentDto = {
      userId: 'valid-uuid',
      providerId: 'valid-uuid',
      dateTime: new Date(),
      type: AppointmentType.IN_PERSON, // Use enum from @austa/interfaces
    };

    return agent
      .post('/appointments')
      .send(createAppointmentDto)
      .expect(HttpStatus.FORBIDDEN)
      .expect((res) => {
        // Use structured error response format from centralized error framework
        expect(res.body.error.code).toBe(AUTH_INSUFFICIENT_PERMISSIONS);
        expect(res.body.error.type).toBe('BUSINESS');
        expect(res.body.error.message).toBeDefined();
      });
  });

  it('/appointments (GET) should return 200 if successful', () => {
    return agent
      .get('/appointments')
      .expect(HttpStatus.OK);
  });

  it('/appointments/:id (GET) should return 200 if successful', () => {
    return agent
      .get('/appointments/valid-uuid')
      .expect(HttpStatus.OK);
  });

  it('/appointments/:id (PATCH) should return 200 if successful', () => {
    const updateAppointmentDto = {
      notes: 'Updated notes',
    };

    return agent
      .patch('/appointments/valid-uuid')
      .send(updateAppointmentDto)
      .expect(HttpStatus.OK);
  });

  it('/appointments/:id (DELETE) should return 204 if successful', () => {
    return agent
      .delete('/appointments/valid-uuid')
      .expect(HttpStatus.NO_CONTENT);
  });
  
  // Additional test for appointment not found scenario using new error framework
  it('/appointments/:id (GET) should return 404 if appointment not found', () => {
    return agent
      .get('/appointments/non-existent-uuid')
      .expect(HttpStatus.NOT_FOUND)
      .expect((res) => {
        // Use structured error response format from centralized error framework
        expect(res.body.error.code).toBeDefined();
        expect(res.body.error.type).toBe('BUSINESS');
        expect(res.body.error.message).toContain('appointment');
      });
  });
});